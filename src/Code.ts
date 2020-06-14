type MailMessage = {
  date: string
  from: string
  subject: string
  body: string
  link: string
}

const dayOfWeekList = ['日', '月', '火', '水', '木', '金', '土']

const getFormatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayOfWeek = dayOfWeekList[date.getDay()]
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()

  return `${year}/${month}/${day} (${dayOfWeek}) ${hours}:${minutes}:${seconds}`
}

const sendLINE = (message: string): void => {
  const token = PropertiesService.getScriptProperties().getProperty(
    'LINE_TOKEN'
  )
  const payload = { message }
  const options = {
    method: 'post',
    payload,
    headers: { Authorization: `Bearer ${token}` },
  }
  UrlFetchApp.fetch('https://notify-api.line.me/api/notify', options)
}

const sendSlack = (message: MailMessage): void => {
  const webhookURL = PropertiesService.getScriptProperties().getProperty(
    'SLACK_WEB_HOOK_URL'
  )

  const payload = {
    attachments: [
      {
        blocks: [
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `*${message.from}*\n :date: ${message.date}`,
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `<${message.link}|*${message.subject}*>`,
            },
          },
          {
            type: 'divider',
          },
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text: message.body,
              emoji: false,
            },
          },
        ],
      },
    ],
  }

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
  }

  UrlFetchApp.fetch(webhookURL, options)
}

const fetchContactMail = (): MailMessage[] => {
  // 取得間隔
  const now = Math.floor(new Date().getTime() / 1000)
  const interval = 30 // 30分前〜現在の新着メールを取得
  const term = now - 60 * interval

  const searchCondition = `(is:unread after: ${term})`

  const threads = GmailApp.search(searchCondition)
  const mailMessages = threads.map((thread) => {
    const messages = GmailApp.getMessagesForThread(thread)
    // スレッドの中の最新のメッセージのみを取得
    const message = messages[messages.length - 1]
    message.markRead()

    return {
      date: getFormatDate(message.getDate()),
      from: message.getFrom(),
      subject: message.getSubject() || '件名なし',
      body: message.getPlainBody(),
      link: thread.getPermalink(),
    }
  })

  return mailMessages
}

function main(): void {
  const newMessages = fetchContactMail()
  if (newMessages.length > 0) {
    newMessages.forEach((message) => {
      sendSlack(message)
    })
  }
}
