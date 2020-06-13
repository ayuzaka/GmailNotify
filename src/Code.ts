const sendLINE = (message: string): void => {
  const token = 'xxxxxxx';
  const payload = { message };
  const options = {
    method: 'post',
    payload,
    headers: { Authorization: `Bearer ${token}` },
  };
  UrlFetchApp.fetch('https://notify-api.line.me/api/notify', options);
};

const fetchContactMail = (): string[] => {
  // 取得間隔
  const now = Math.floor(new Date().getTime() / 1000);
  const interval = 30; // 30分前〜現在の新着メールを取得
  const term = now - 60 * interval;

  const searchCondition = `(is:unread after: ${term})`;

  const threads = GmailApp.search(searchCondition);
  const messages = GmailApp.getMessagesForThreads(threads);
  const displayMessages = messages.map((message) => {
    const msg = message.slice(-1)[0];
    msg.markRead();

    return `\n【date】${msg.getDate()}
            \n【From】${msg.getFrom()}
            \n【Subject】${msg.getSubject()}
            \n【Body】${msg.getPlainBody().slice(0, 200)}`;
  });

  return displayMessages;
};

function main(): void {
  const newMessages = fetchContactMail();
  if (newMessages.length > 0) {
    newMessages.forEach((message) => {
      sendLINE(message);
    });
  }
}
