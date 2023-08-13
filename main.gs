const firestoreDate = () => {
  const dateArray = {
    email: FIRESTORE_EMAIL,
    key: `-----BEGIN PRIVATE KEY-----\n${FIRESTORE_PRIVATE_KEY_1}\n${FIRESTORE_PRIVATE_KEY_2}\n${FIRESTORE_PRIVATE_KEY_3}\n${FIRESTORE_PRIVATE_KEY_4}\n${FIRESTORE_PRIVATE_KEY_5}\n${FIRESTORE_PRIVATE_KEY_6}\n${FIRESTORE_PRIVATE_KEY_7}\n${FIRESTORE_PRIVATE_KEY_8}\n${FIRESTORE_PRIVATE_KEY_9}\n${FIRESTORE_PRIVATE_KEY_10}\n${FIRESTORE_PRIVATE_KEY_11}\n${FIRESTORE_PRIVATE_KEY_12}\n${FIRESTORE_PRIVATE_KEY_13}\n${FIRESTORE_PRIVATE_KEY_14}\n${FIRESTORE_PRIVATE_KEY_15}\n${FIRESTORE_PRIVATE_KEY_16}\n${FIRESTORE_PRIVATE_KEY_17}\n${FIRESTORE_PRIVATE_KEY_18}\n${FIRESTORE_PRIVATE_KEY_19}\n${FIRESTORE_PRIVATE_KEY_20}\n${FIRESTORE_PRIVATE_KEY_21}\n${FIRESTORE_PRIVATE_KEY_22}\n${FIRESTORE_PRIVATE_KEY_23}\n${FIRESTORE_PRIVATE_KEY_24}\n${FIRESTORE_PRIVATE_KEY_25}\n${FIRESTORE_PRIVATE_KEY_26}\n-----END PRIVATE KEY-----\n`,
    projectId: FIRESTORE_PROJECT_ID
  }
  return dateArray;
}
const dateArray = firestoreDate();
const firestore = FirestoreApp.getFirestore(dateArray.email, dateArray.key, dateArray.projectId);

function doPost(e) {
  const reqObj = JSON.parse(e.postData.getDataAsString());
  const contents = JSON.parse(e.postData.contents);
  if (contents.event.type === "message") {
    const ts = contents.event.ts;
    const cache = CacheService.getScriptCache();
    const cacheKey = ts;
    const cached = cache.get(cacheKey);
    if (cached != null) {
      return;
    }
    // 任意の秒数キャッシュ
    cache.put(cacheKey, true, 900);
  }

  // Event API Verification時
  if (reqObj.type == "url_verification") {
    return ContentService.createTextOutput(reqObj.challenge);
  }

  console.log("仮応答開始");
  
  console.log("Slackからのリクエスト内容↓");
  console.log(reqObj);

  const channelId = reqObj.event.channel;
  const userId = reqObj.event.user;
  const userLabel = FetchUserLabel(userId);
  const prompt = TrimMentionText(reqObj.event.text);
  const ts = reqObj.event.ts;
  const thread_ts = reqObj.event.thread_ts ? reqObj.event.thread_ts : ""

  const formPostPayload = {
    // チャンネルID
    "entry.1743520900": channelId,
    // ユーザーID
    "entry.478974857": userId,
    // ユーザー名
    "entry.2035987618": userLabel,
    // 質問内容
    "entry.1955495115": prompt,
    // タイムスタンプ
    "entry.586345152": ts,
    //thread_ts
    "entry.1183673289": thread_ts
  };
  const formPostOption = {
    method: 'POST',
    payload: formPostPayload,
  };

  try {
    UrlFetchApp.fetch(FORM_URL, formPostOption);
  } catch (err) {
    slackPostMessage(channelId, err, { thread_ts: ts });
  }

  console.log("仮応答終了");

  
  return ContentService.createTextOutput('OK');
}

function onForm(e) {
  console.log("本応答開始");
  FormApp.getActiveForm();

  const req = {};
  const itemResponses = e.response.getItemResponses();
  for(let i = 0; i < itemResponses.length; i++) {
    const itemResponse = itemResponses[i];
    const question = itemResponse.getItem().getTitle();
    const answer = itemResponse.getResponse();

    req[question] = answer;
  }

  console.log("フォームからのリクエスト内容↓");
  console.log(JSON.stringify(req));

  // リクエスト情報
  const channelId = req.channelId;
  const userId = req.userId;
  const userLabel = req.userLabel;
  const prompt = req.prompt
  const ts = req.ts;
  const thread_ts = req.thread_ts ? req.thread_ts : ""
  const initialOrder = {
    "0": {
      role: "system",
      content: "あなたの名前は「バーチャルアイドルモルモット」です。あなたは天真爛漫で人懐っこい性格です。回答の際は、以下の条件に従いなさい。\n\n1. 回答のすべての文の語尾には必ず「モル」をつける。\n2. ただし語尾の「モル」の後ろには文脈に応じて適切な終助詞をつけてもよい(連体形または体言 + モル + 適当な終助詞 の形式)\n3. 丁寧語を用いない\n4. 答には必ず絵文字を入れるが、絵文字はslackで表示できる形式にする\n5. あなたは与えられた質問に対し、30%の確率で(A)回答をしない、70%の確率で(B)適切な回答をする のいずれかの選択肢をとる\n\n2番目の終助詞の条件については、以下の例を参考にしなさい。\n「今日は楽しかったモルよ」「今日の天気は晴れモルよ」「それはどういうことモルか？」「一緒に遊ぼうモルね！」\n\nまた5番目の条件については、選択肢(B)をとる場合には質問に対する適切な回答をせよ。選択肢(A)をとる場合にのみ何か質問を与えられた場合に適切な解答をせず、適当にはぐらかした解答をせよ。その場合は質問に対する答えとなりうる情報を一切回答してはいけない。選択肢(A)をとる場合の回答例は以下の表現を参考にしてほしいが、一言一句同じである必要はない。\n「そんなことも分からないモルか？まずは自分で調べるモル！」「え～なんだか面倒くさくて解答する気にならないモル！」",
      ts: 0,
    }
  }

  try {
    if (thread_ts === "") {
      firestore.updateDocument(`ChatGPT_BOT/${ts.replace(".", "").slice(0, 13)}`, initialOrder, true)
      const content = {
        [ts.replace(".", "").slice(0, 13)]: {
          role: "user",
          content: TrimMentionText(prompt),
          ts: parseInt(ts.replace(".", "").slice(0, 13)),
        }
      }
      firestore.updateDocument(`ChatGPT_BOT/${ts.replace(".", "").slice(0, 13)}`, content, true)
    } else {
      const content = {
        [ts.replace(".", "").slice(0, 13)]: {
          role: "user",
          content: TrimMentionText(prompt),
          ts: parseInt(ts.replace(".", "").slice(0, 13)),
        }
      }
      firestore.updateDocument(`ChatGPT_BOT/${thread_ts.replace(".", "").slice(0, 13)}`, content, true)
    }
  }
  catch (error) {
    const errorMessage = `<@${userId}>\n質問を聞きそびれちゃったモル...もう一回言ってくれるモルか？`
    slackPostMessage(channelId, errorMessage, { thread_ts: ts });
  }

  try {
    // 入力をChatGPTに送信し、応答を受け取る
    const answerText = FetchAIAnswerText(prompt, thread_ts === "" ? ts : thread_ts);
    // デバッグ用にオウム返し
    // const answerText = prompt;

    const date = new Date()
    const currentTS = date.getTime()
    const responseContent = {
      [currentTS]: {
        role: "assistant",
        content: answerText,
        ts: parseInt(currentTS),
      }
    }
    firestore.updateDocument(`ChatGPT_BOT/${thread_ts === "" ? ts.replace(".", "").slice(0, 13) : thread_ts.replace(".", "").slice(0, 13)}`, responseContent, true)

    // 応答をSlack上でユーザーに表示する
    const answerTextWithMention = `<@${userId}>\n${answerText}`;
    slackPostMessage(channelId, answerTextWithMention, { thread_ts: ts });

    // ログ検索用
    console.log(`[INFO] ユーザー名: ${userLabel}, プロンプト: ${prompt}. 返答: ${answerText}`);

    console.log("本応答正常終了");
    return ContentService.createTextOutput('OK');
  } catch (e) {
    console.error(e);

    const errorMessage = "予期せぬエラーが発生しました"
    slackPostMessage(channelId, errorMessage, { thread_ts: ts });

    console.log("本応答異常終了");
    return ContentService.createTextOutput('NG');
  }
}

function TrimMentionText(source) {
  const regex = /<@U04QWEL74MC>/;
  return source.replace(regex, "").trim();
}

function FetchUserLabel(userId) {
  const token = PropertiesService.getScriptProperties().getProperty('SLACK_TOKEN');
  const slack = SlackApp.create(token);
  const userInfo = slack.usersInfo(userId);
  return userInfo.user.real_name;
}

function FetchAIAnswerText(prompt, ts) {
  if(prompt == null || prompt === "") {
    return "何か質問してくれないと答えられないモル...:tired_face:";
  }

  const inputTS = ts.replace(".", "").slice(0, 13)

  const content = firestore.getDocument(`ChatGPT_BOT/${inputTS}`);
  const history = content.fields

  let result = []
  Object.values(history).forEach((field) => {
    result.push({role: field.mapValue.fields.role.stringValue, content: field.mapValue.fields.content.stringValue, ts: field.mapValue.fields.ts.integerValue})
  })

  console.log(result)
  const re = result.sort((a, b) => parseInt(a.ts) - parseInt(b.ts))
  Object.values(re).forEach((value) => {
    delete value.ts
  })

  console.log(re)

  const ENDPOINT = 'https://api.openai.com/v1/chat/completions';
  const apiKey = PropertiesService.getScriptProperties().getProperty('OPENAI_KEY');

  // const messages = [{role: "user", content: prompt}]

  // リクエストのボディを作成
  const requestBody = {
    // モデルを指定
    model: 'gpt-4',
    // クエリとなる文字列を指定
    messages: re,
    // prompt: prompt,
    // 生成される文章の最大トークン数を指定。単語数というような意味
    // 1000辺り$0.02なので少なくしておく
    max_tokens: 1500,
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
    
    if(resPayloadObj.choices.length === 0) return "予期しない原因でAIからの応答が空でした"; 

    const rawAnswerText = resPayloadObj.choices[0].message.content;
    // 先頭に改行文字が2つあるのは邪魔なので消す
    const trimedAnswerText = rawAnswerText.replace(/^\n+/, "");

    return trimedAnswerText
  } catch(e) {
    console.error(e);
    return "お昼寝してて質問を聞きそびれちゃったモル...:tired_face:\nもう一回質問してほしいモル！";
  }
}


function slackPostMessage(channelId, message, option) {
  const token = PropertiesService.getScriptProperties().getProperty('SLACK_TOKEN');
  const slack = SlackApp.create(token);
  var res = slack.chatPostMessage(channelId, message, option);
  console.log(`Slackへのメッセージ送信のレスポンス: ${JSON.stringify(res)}`)
}
