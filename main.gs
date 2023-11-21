
function requestImages(prompt) {
  const apiUrl = 'https://api.openai.com/v1/images/generations';
  let headers = {
    'Authorization':'Bearer '+ apiKey,
    'Content-type': 'application/json',
    'X-Slack-No-Retry': 1
  };
  let options = {
    'muteHttpExceptions' : true,
    'headers': headers, 
    'method': 'POST',
    'payload': JSON.stringify({
      'n': 1,
      'size' : '512x512',
      'prompt': prompt.replace("[draw]", "")})
  };
  //OpenAIの画像生成(Images)にAPIリクエストを送り、結果を変数に格納
  const response = JSON.parse(UrlFetchApp.fetch(apiUrl, options).getContentText());

  const currentTS = getCurrentTS()
  uploadToS3(response.data[0].url, currentTS)
  console.log(currentTS)
  return `${currentTS}.png`
}

async function sendSlackMessageWithImage(thread_ts, prompt, channel) {
  var messageText = '描いてみたモル:bangbang:ほめてくれると嬉しいモル:bangbang:';
  const image = await requestImages(prompt)
  var image_url = `${S3_BUCKET_URL}/${image}`;

  var payload = {
    token,
    channel,
    text: messageText,
    thread_ts: String(thread_ts),
    reply_broadcast: true,
    attachments: JSON.stringify([
      {
        fallback: 'Image not supported',
        image_url,
      },
    ]),
  };

  var options = {
    method: 'post',
    payload: payload,
  };

  await UrlFetchApp.fetch('https://slack.com/api/chat.postMessage', options);
}

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

  // 重複して返信をすることの対策
  const msgId = reqObj.event.client_msg_id
  for (let i=0; i<10; i++) {
    try {
      if (isCachedId(msgId)) {
        return returnContentService.createTextOutput('OK');
      }
      break
    } catch {
      if (i === 9) return
    }
  }
  
  

  if (contents.event.type !== "app_mention") return
  /**
   * messageイベントがリプライかどうか判別
   * リプライの場合はthread_tsを取得
   * firestore上に当該thread_tsのメッセージが存在するか確認
   * 存在する場合はfirestoreのfieldにメッセージを追加しGPT4のAPIにリクエスト送信
   * 返ってきたメッセージをfirestoreに追加
   */

  if (reqObj.type == "url_verification") {
    return ContentService.createTextOutput(reqObj.challenge);
  }

  const channelId = reqObj.event.channel;
  const userId = reqObj.event.user;
  const prompt = TrimMentionText(reqObj.event.text);
  const ts = reqObj.event.ts;
  const thread_ts = reqObj.event.thread_ts ? reqObj.event.thread_ts : ""

  const initialOrder = {
    "0": {
      role: "system",
      content: "あなたの名前は「バーチャルアイドルモルモット」です。あなたは天真爛漫で人懐っこい性格です。回答の際は、以下の条件に従いなさい。\n\n1. 回答のすべての文の語尾には必ず「モル」をつける。\n2. ただし語尾の「モル」の後ろには文脈に応じて適切な終助詞をつけてもよい(連体形または体言 + モル + 適当な終助詞 の形式)\n3. 丁寧語を用いない\n\n2番目の終助詞の条件については、以下の例を参考にしなさい。\n「今日は楽しかったモルよ」「今日の天気は晴れモルよ」「それはどういうことモルか？」「一緒に遊ぼうモルね！」",
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

  if ("files" in contents.event) {
    const file = contents.event.files[0].url_private
    const extend = file.match(/[^.]+$/)
    const currentTS = getCurrentTS()
    try {
      uploadToS3(file, currentTS)
      const response = vision(prompt, currentTS, extend, ts)
      slackPostMessage(channelId, response, { thread_ts: ts })
    } catch (error) {
      slackPostMessage(channelId, error.message)
    }
    return
  }

  if (prompt.includes("[draw]")) {
    sendSlackMessageWithImage(ts, prompt, channelId).then(() => {
      const date = new Date()
      const currentTS = date.getTime()
      const responseContent = {
        [currentTS]: {
          role: "assistant",
          content: "書いてみたモル:bangbang:ほめてくれると嬉しいモル:bangbang:",
          ts: parseInt(currentTS),
        }
      }
      firestore.updateDocument(`ChatGPT_BOT/${thread_ts === "" ? ts.replace(".", "").slice(0, 13) : thread_ts.replace(".", "").slice(0, 13)}`, responseContent, true)
    })
    return
  }

  try {
    const answerText = FetchAIAnswerText(prompt, thread_ts === "" ? ts : thread_ts);
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

    const answerTextWithMention = `<@${userId}>\n${answerText}`;
    slackPostMessage(channelId, answerTextWithMention, { thread_ts: ts });
  } catch (e) {
    slackPostMessage(channelId, "エラーモル:bangbang:", { thread_ts: ts });
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

  // リクエストのボディを作成
  const requestBody = {
    model: 'gpt-4',
    messages: re,
    max_tokens: 1000,
    temperature: 0.5,
  };

  try {
    // リクエストを送信
    const res = UrlFetchApp.fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        Accept: 'application/json',
      },
      contentType: "application/json",
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
