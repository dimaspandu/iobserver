const MailCrawler = require('./MailCrawler')
const InDB = require('./InDB')

exports.observable = async function () {
    try {
        const xlsData = await MailCrawler.crawl()

        if (!xlsData || !xlsData.length) {
            throw new Error("null/undefined xls data")
        }

        await InDB.run(xlsData)
    } catch (error) {
        console.error(error)
    }
}