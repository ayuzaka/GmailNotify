function sendLine(message: string): void {
  const token = 'xxxxxxx';
  const payload = { message };
  const options = {
    method: 'post',
    payload,
    headers: { Authorization: `Bearer ${token}` }
  };
  UrlFetchApp.fetch('https://notify-api.line.me/api/notify', options);
}

function fetchContactMail(): string[] {
  // 取得間隔
  const now = Math.floor(new Date().getTime() / 1000);
  const interval = 30; // 30分前〜現在の新着メールを取得
  const term = now - 60 * interval;

  const searchCondition = `(is:unread after: ${term})`;

  const threads = GmailApp.search(searchCondition);
  const messages = GmailApp.getMessagesForThreads(threads);
  const displayMessages = messages.map(message => {
    message.slice(-1)[0].markRead();

    return `\n【date】${message.slice(-1)[0].getDate()}
            \n【From】${message.slice(-1)[0].getFrom()}
            \n【Subject】${message.slice(-1)[0].getSubject()}
            \n【Body】${message
              .slice(-1)[0]
              .getPlainBody()
              .slice(0, 200)}`;
  });

  return displayMessages;
}

function main(): void {
  const newMessages = fetchContactMail();
  if (newMessages.length > 0) {
    newMessages.forEach(message => {
      sendLine(message);
    });
  }
}
