const postMessage = (channelId, message) => {
  const token = PropertiesService.getScriptProperties().getProperty('SLACK_TOKEN');
  const slack = SlackApp.create(token);
  slack.chatPostMessage(channelId, message);
}

// 練習参加状況スプシのリマインド
const recordAttendance = () => {
  const message = `<!channel>\n練習お疲れ様モル:bangbang:<https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}|練習出欠スプシ>の自分の担当パート名のシートに今日の団員の出欠を記録してほしいモル:star-struck:`
  // postMessage("C04CFG05V47", message)
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
  Object.keys(parts).forEach((part) => {
    const partSheet = ss.getSheetByName(parts[part].partName)
    var range = partSheet.getRange(2, 4, 1, 100);
    var days = range.getValues().flat().filter((day) => day !== "");
    days.forEach((day) => {
      const targetDay = new Date(day)
      const targetMonth = targetDay.getMonth() + 1
      const targetDate = targetDay.getDate()
      const currentDay = new Date()
      const currentMonth = currentDay.getMonth() + 1
      const currentDate = currentDay.getDate()
      const tempDay = new Date()
      tempDay.setMonth(tempDay.getMonth() - 1, 0)
      
      if (targetMonth === (currentDate === 1 ? currentMonth - 1 : currentMonth) && targetDate === (currentDate === 1 ? tempDay.getDate(): (currentDate - 1))) {
        const ind = days.indexOf(day)
        console.log(generateDateString(targetMonth, targetDate))
        const attendance = partSheet.getRange(3, ind + 4, 25, 1)
        const attendanceList = attendance.getValues().flat()
        
        if (!attendanceList.includes("遅刻") && !attendanceList.includes("出席")) {
          emptyParts.push(parts[part].leaders)
        }
      }
    })
  })

  let emptyPartMentions = ""
  emptyParts.forEach((emptyPart) => {
    emptyPart.forEach((id) => {
      emptyPartMentions += `<@${id}> `
    })
  })

  if (emptyPartMentions !== "") {
    const message = `${emptyPartMentions}\nまだ昨日の練習の出欠が入力されてないモル:tired_face:忘れないうちに<https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}|練習出欠スプシ>に入力するモル:bangbang:`
    // postMessage("C04CFG05V47", message) // こっち
    // postMessage("C04BJ4X784B", message)
  }
}


