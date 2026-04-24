// Google Workspace Add-on for IBON Admin System
// Click the sidebar icon → opens the Admin System in a new tab

const APP_URL = 'https://adminsystem.iboninternational.org/login?provider=google'
const APP_LOGO = 'https://adminsystem.iboninternational.org/icons/icon-192x192.png'

function buildHomePage(e) {
  // Immediately open the app URL when the icon is clicked
  return CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('IBON Admin System')
        .setImageUrl(APP_LOGO)
        .setImageStyle(CardService.ImageStyle.CIRCLE)
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextButton()
            .setText('Open Admin System →')
            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
            .setOpenLink(
              CardService.newOpenLink()
                .setUrl(APP_URL)
                .setOpenAs(CardService.OpenAs.FULL_SIZE)
                .setOnClose(CardService.OnClose.NOTHING)
            )
        )
        .addWidget(
          CardService.newTextParagraph()
            .setText('Click the button above to open the IBON HR Admin System.')
        )
    )
    .build()
}

function buildHomePage(e) {
  return buildCard()
}

function buildCard() {
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle(APP_NAME)
        .setSubtitle('HR Management System')
        .setImageUrl(APP_LOGO)
        .setImageStyle(CardService.ImageStyle.CIRCLE)
    )

  const section = CardService.newCardSection()

  // Open app button
  section.addWidget(
    CardService.newTextButton()
      .setText('🚀 Open Admin System')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(
        CardService.newAction().setFunctionName('openApp')
      )
  )

  // Quick links
  section.addWidget(
    CardService.newDecoratedText()
      .setTopLabel('Quick Links')
      .setText('My Leave Requests')
      .setStartIcon(CardService.newIconImage().setIconUrl(APP_LOGO))
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('openLink')
          .setParameters({ url: APP_URL + '/leave' })
      )
  )

  section.addWidget(
    CardService.newDecoratedText()
      .setText('My Travel Requests')
      .setStartIcon(CardService.newIconImage().setIconUrl(APP_LOGO))
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('openLink')
          .setParameters({ url: APP_URL + '/travel' })
      )
  )

  section.addWidget(
    CardService.newDecoratedText()
      .setText('My Info')
      .setStartIcon(CardService.newIconImage().setIconUrl(APP_LOGO))
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('openLink')
          .setParameters({ url: APP_URL + '/my-info' })
      )
  )

  section.addWidget(
    CardService.newDecoratedText()
      .setText('Office Supplies Request')
      .setStartIcon(CardService.newIconImage().setIconUrl(APP_LOGO))
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('openLink')
          .setParameters({ url: APP_URL + '/office-supplies/request' })
      )
  )

  card.addSection(section)
  return card.build()
}

function openApp() {
  return CardService.newActionResponseBuilder()
    .setOpenLink(
      CardService.newOpenLink()
        .setUrl(APP_URL)
        .setOpenAs(CardService.OpenAs.FULL_SIZE)
        .setOnClose(CardService.OnClose.NOTHING)
    )
    .build()
}

function openLink(e) {
  const url = e.parameters.url
  return CardService.newActionResponseBuilder()
    .setOpenLink(
      CardService.newOpenLink()
        .setUrl(url)
        .setOpenAs(CardService.OpenAs.FULL_SIZE)
        .setOnClose(CardService.OnClose.NOTHING)
    )
    .build()
}
