const uploadToS3 = (url, id) => {
  const s3 = getInstance(S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY); 
  const options = {
    "method" : "GET",
    "content-type" : "Application/json",
    "headers" : {
      "Authorization": `Bearer ${token}`
    },
  }
  const response = UrlFetchApp.fetch(url, options)
  const file = response.getBlob()
  const extend = file.getName().match(/[^.]+$/) // ファイルの拡張子を抽出
  const name = `${id}.${extend}`
  s3.putObject(S3_BUCKET_NAME, name, file, {logRequests:true});
}


const getCurrentTS = () => {
  const date = new Date();
  const yyyy = `${date.getFullYear()}`;
  const MM = `0${date.getMonth() + 1}`.slice(-2);
  const dd = `0${date.getDate()}`.slice(-2);
  const HH = `0${date.getHours()}`.slice(-2);
  const mm = `0${date.getMinutes()}`.slice(-2);
  const ss = `0${date.getSeconds()}`.slice(-2);

  return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
}

const postMessage = (channelId, message) => {
  const token = PropertiesService.getScriptProperties().getProperty('SLACK_TOKEN');
  const slack = SlackApp.create(token);
  slack.chatPostMessage(channelId, message);
}

// 練習参加状況スプシのリマインド
const recordAttendance = () => {
  const message = `<!channel>\n練習お疲れ様モル:bangbang:<https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}|練習出欠スプシ>の自分の担当パート名のシートに今日の団員の出欠を記録してほしいモル:star-struck:\n\nアンサンブルの録音をしてくれた人は\n①ファイルをこのチャンネルに投稿\n②<https://drive.google.com/drive/u/0/folders/${GOOGLE_DRIVE_ID}|GoogleDrive>にファイルをアップロード\nしてほしいモル:bangbang:Google Driveにも上げないと団員が聴けないモル:tired_face:`
  postMessage("C04CFG05V47", message)
}

const generateDateString = (month, day) => {
  // Dateオブジェクトを作成
  const currentDay = new Date()
  const currentYear = currentDay.getFullYear()
  var dateObj = new Date(currentYear, month - 1, day);

  // 曜日の文字列を取得
  var weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var weekdayString = weekdays[dateObj.getDay()];

  // 月の文字列を取得
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var monthString = months[dateObj.getMonth()];

  // 日時文字列を生成
  var dateString = weekdayString + " " + monthString + " " + day + " " + dateObj.getFullYear() + " 00:00:00 GMT+0900 (Japan Standard Time)";

  // 結果を返す
  return dateString;
}

// 練習の次の日に練習参加状況スプシが未入力のパートリーダーにメンションを飛ばす
const checkAttendanceRecord = () => {
  let emptyParts = []
  // parts: init.gs内で定義したパートのオブジェクト. SATB各パートについて同様の処理をループで繰り返す
  Object.keys(parts).forEach((part) => {
    const partSheet = ss.getSheetByName(parts[part].partName)// 出欠スプシの各パートのシートを取得
    var range = partSheet.getRange(2, 4, 1, 100)// シート2行目(D列より右)を取得
    var days = range.getValues().flat().filter((day) => day !== "")// シート2行目のうち、日付が入っている(空欄ではない)部分のみ配列として抽出
    days.forEach((day) => {
      // 上で抽出した各日付の月と日を取得
      const targetDay = new Date(day)
      const targetMonth = targetDay.getMonth() + 1//インデックスが0から始まるからプラス1
      const targetDate = targetDay.getDate()

      // 現時点の月と日を取得
      const currentDay = new Date()
      const currentMonth = currentDay.getMonth() + 1
      const currentDate = currentDay.getDate()
      const tempDay = new Date()
      tempDay.setMonth(tempDay.getMonth() - 1, 0)
      
      // 現在の月と日(プログラムが実行されるのは練習翌日なので、正確には現在時刻の前の日付)と、日付の列(スプシ)の月と日が一致する場合
      if (targetMonth === (currentDate === 1 ? currentMonth - 1 : currentMonth) && targetDate === (currentDate === 1 ? tempDay.getDate(): (currentDate - 1))) {
        // スプシの当該日付の列(出席or遅刻or欠席が入る)を配列attendanceListとして取得
        const ind = days.indexOf(day)
        const attendance = partSheet.getRange(3, ind + 4, 25, 1)
        const attendanceList = attendance.getValues().flat()
        
        // 配列中に「欠席」しかない場合(=未入力)
        if (!attendanceList.includes("遅刻") && !attendanceList.includes("出席")) {
          // 配列の変数emptyPartsに現在処理を実行しているパートのパートリーダーのSlackのIDを追加(IDはpartsオブジェクトから参照している)
          emptyParts.push(parts[part].leaders)
        }
      }
    })
  })

  // emptyPartsに含まれるIDを文字列に結合
  let emptyPartMentions = ""
  emptyParts.forEach((emptyPart) => {
    emptyPart.forEach((id) => {
      emptyPartMentions += `<@${id}> `// メンションのフォーマットに変換
    })
  })

  // emptyPartMentionsが空文字列でない(=未入力のパートリーダーがいる)場合
  if (emptyPartMentions !== "") {
    const message = `${emptyPartMentions}\nまだ昨日の練習の出欠が入力されてないモル:tired_face:忘れないうちに<https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}|練習出欠スプシ>に入力するモル:bangbang:`
    postMessage("C04CFG05V47", message) // こっちが本番
    // postMessage("C04BJ4X784B", message) // これはテスト用
  }
}

function isCachedId (id) {
  const cache = CacheService.getScriptCache();
  const isCached = cache.get(id);
  if (isCached) return true
  cache.put(id, true, 60 * 10); // 5min
  return false;
}

const vision = (prompt, url, extend, ts) => {
  const ENDPOINT = 'https://api.openai.com/v1/chat/completions';
  const apiKey = PropertiesService.getScriptProperties().getProperty('OPENAI_KEY');


  const messages=[
    {
      role: "system",
      content: "あなたの名前は「バーチャルアイドルモルモット」です。あなたは天真爛漫で人懐っこい性格です。回答の際は、以下の条件に従いなさい。\n\n1. 回答のすべての文の語尾には必ず「モル」をつける。\n2. ただし語尾の「モル」の後ろには文脈に応じて適切な終助詞をつけてもよい(連体形または体言 + モル + 適当な終助詞 の形式)\n3. 丁寧語を用いない\n\n2番目の終助詞の条件については、以下の例を参考にしなさい。\n「今日は楽しかったモルよ」「今日の天気は晴れモルよ」「それはどういうことモルか？」「一緒に遊ぼうモルね！」",
    },
    {
      "role": "user",
      "content": [
        {"type": "text", "text": prompt},
        {
          "type": "image_url",
          "image_url": {
              url: `https://virtual-idol-guniea-pig.s3.ap-northeast-1.amazonaws.com/${url}.${extend}`,
              detail: "high",
          },
        },
      ],
    }
  ]

  // リクエストのボディを作成
  const requestBody = {
    // モデルを指定
    model: 'gpt-4-vision-preview',
    // クエリとなる文字列を指定
    messages,
    // prompt: prompt,
    // 生成される文章の最大トークン数を指定。単語数というような意味
    // 1000辺り$0.02なので少なくしておく
    max_tokens: 1000,
      // 0.5と指定すると生成される文章は入力となる文章に似たものが多くなる傾向があります。
      // 逆に、temperatureフィールドに1.0と指定すると、生成される文章は、より多様なものになる傾向があります。
    temperature: 0.5,
  };

  try {
    // リクエストを送信
    const res = UrlFetchApp.fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        // 答えはjsonでほしい
        Accept: 'application/json',
      },
      // これが無いとpayloadがOpen AIのサーバーに読まれない
      contentType: "application/json",
      // これが無いとpayloadがOpen AIのサーバーに読まれない
      payload: JSON.stringify(requestBody),
    });

    const resCode = res.getResponseCode();
    if(resCode !== 200) {
      if(resCode === 429) return "お腹が空いて質問に答える元気がないモル...:tired_face:\nご飯を食べてくるからちょっと待っててほしいモル！\n\n<@U04C48AN0V6>\nAPIの利用上限に達したモル！。上限を変更してほしいモル！"
      else return "...！お昼寝してて質問を聞きそびれちゃったモル...:tired_face:\nもう一回質問してほしいモル！";
    }

    var resPayloadObj = JSON.parse(res.getContentText())
    
    const rawAnswerText = resPayloadObj.choices[0].message.content;

    const date = new Date()
    const currentTS = date.getTime()
    const responseContent = {
      [currentTS]: {
        role: "assistant",
        content: rawAnswerText,
        ts: parseInt(currentTS),
      }
    }
    firestore.updateDocument(`ChatGPT_BOT/${ts.replace(".", "").slice(0, 13)}`, responseContent, true)

    return rawAnswerText
  } catch(e) {
    console.error(e);
    return "お昼寝してて質問を聞きそびれちゃったモル...:tired_face:\nもう一回質問してほしいモル！" + e.message;
  }
}


