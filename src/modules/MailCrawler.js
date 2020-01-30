require('dotenv').config()
const Imap = require('imap')
const { Base64Decode } = require('base64-stream')
const unzipper = require('unzipper')
const HTMLTableToJson = require('html-table-to-json')

const imap = new Imap({
    user: process.env.MAIL_NAME,
    password: process.env.MAIL_PASSWORD,
    host: 'imap.gmail.com',
    port: 993,
    tls: true
})

function establishConnection() {
    return new Promise((resolve, reject) => {
        imap.connect()

        imap.once("ready", () => resolve())

        imap.once("error", (error) => reject(error))
    })
}

function terminateConnection() {
    imap.end()
}

function fetchLatestMessageBySubject(subject) {
    return new Promise((resolve, reject) => {
        imap.openBox('INBOX', true, function (error, box) {
            if (error) {
                reject(error)

                return
            }

            imap.search([["HEADER", "SUBJECT", subject]], (error, uids) => {
                if (error) {
                    reject(error)

                    return
                }

                if (!uids || !uids.length) {
                    reject(new Error(`there aren't any message that contains "${subject}" in their subject field`))

                    return
                }

                const LATEST = -1

                let fetch = imap.fetch(uids.slice(LATEST), {
                    bodies: "",
                    struct: true
                })

                if (!fetch) {
                    reject(new Error("something went wrong, failed to fetch message"))

                    return
                }

                fetch.once('error', function (error) {
                    reject(error)
                }).on('message', function (message) {
                    resolve(message)
                })
            })
        })
    })
}

function findAttachmentBodyparts(bodyparts) {
    if (!bodyparts || !bodyparts.length) {
        return null
    }

    let attachmentBodyparts = []

    bodyparts.forEach(bodypart => {
        if (Array.isArray(bodypart)) {
            const subAttachmentBodyparts = findAttachmentBodyparts(bodypart)
            attachmentBodyparts = subAttachmentBodyparts && subAttachmentBodyparts.length
                ? attachmentBodyparts.concat(subAttachmentBodyparts)
                : attachmentBodyparts

            return
        }

        if (!bodypart.disposition || bodypart.disposition.type.toUpperCase() !== "ATTACHMENT") {
            return
        }

        attachmentBodyparts.push(bodypart)
    })

    return attachmentBodyparts
}

async function fetchAttachmentFromLatestMessageBySubject(subject) {
    const message = await fetchLatestMessageBySubject(subject)

    return new Promise((resolve, reject) => {
        message.once('attributes', function ({ uid, struct }) {
            if (struct.length <= 1) {
                reject(new Error("message doesn't have a multipart body, therefore no attachment"))

                return
            }

            const attachmentBodyparts = findAttachmentBodyparts(struct)

            if (!attachmentBodyparts || !attachmentBodyparts.length) {
                reject(new Error("message has no attachment"))

                return
            }

            const zipAttachmentBodypart = attachmentBodyparts.find(attachmentBodypart => {
                return /(.zip)$/gi.test(attachmentBodypart.params.name)
            })

            if (!zipAttachmentBodypart) {
                reject(new Error("message has no .zip file attachment)"))

                return
            }

            const fetch = imap.fetch(uid, {
                bodies: zipAttachmentBodypart.partID,
                struct: true
            })

            if (!fetch) {
                reject(new Error("something went wrong, failed to fetch attachment"))

                return
            }

            fetch.on('message', function (attachmentMessage) {
                attachmentMessage.on('body', function (stream) {
                    console.log("downloading attachment :: ", zipAttachmentBodypart.params.name)

                    const awaitAttachmentBuffer = function () {
                        return new Promise((resolve, reject) => {
                            const attachmentBuffers = []
                            const attachmentStream = zipAttachmentBodypart.encoding.toUpperCase() === "BASE64"
                                ? stream.pipe(new Base64Decode())
                                : stream

                            attachmentStream.on("error", function (error) {
                                reject(error)
                            }).on("data", function (chunk) {
                                attachmentBuffers.push(chunk)
                            }).on("end", function () {
                                resolve(Buffer.concat(attachmentBuffers))
                            })
                        })
                    }

                    awaitAttachmentBuffer()
                        .then(zipAttachmentBuffer => {
                            resolve({ attachmentBuffer: zipAttachmentBuffer, attachmentName: zipAttachmentBodypart.params.name })
                        })
                        .catch(error => {
                            reject(error)
                        })
                })

                attachmentMessage.once('end', function () {
                    console.log("finished downloading attachment :: ", zipAttachmentBodypart.params.name)
                })
            })
        })
    })
}

async function processAttachment({ attachmentBuffer, attachmentName }) {
    console.log("processing attachment :: ", attachmentName)

    const { files } = await unzipper.Open.buffer(attachmentBuffer)

    if (!files || !files.length) {
        throw new Error("no file found inside the attached .zip file")
    }

    const xlsFile = files.find(file => /(.xls$)/gi.test(file.path))

    if (!xlsFile) {
        throw new Error("no .xls found inside the attached .zip file")
    }

    console.log("finished processing attachment :: ", attachmentName)

    const xlsFileBuffer = await xlsFile.buffer()

    if (!xlsFileBuffer) {
        throw new Error("something went wrong, failed to get a handle to the .xls file buffer")
    }

    const xlsFileJSON = HTMLTableToJson.parse(xlsFileBuffer.toString("utf-8"), {})

    if (!xlsFileJSON) {
        throw new Error("something went wrong, failed to parse .xls file buffer to json")
    }

    const HEADER_TITLE = 0
    const RESULT_RECORDS = 1

    const xlsFileTitle = xlsFileJSON.headers[HEADER_TITLE][HEADER_TITLE]
    const xlsFileRecords = xlsFileJSON.results[RESULT_RECORDS]

    return {
        title: xlsFileTitle,
        records: xlsFileRecords
    }
}

exports.crawl = async function () {
    const SUBJECT = {
        PARTICIPATE: "Participate_ISUPPLIER",
        VENDOR: "Vendor_ISUPPLIER"
    }

    await establishConnection()

    const participateZipAttachment = await fetchAttachmentFromLatestMessageBySubject(SUBJECT.PARTICIPATE)
    const vendorZipAttachment = await fetchAttachmentFromLatestMessageBySubject(SUBJECT.VENDOR)

    terminateConnection()

    const participateXlsData = await processAttachment(participateZipAttachment)
    const vendorXlsData = await processAttachment(vendorZipAttachment)

    return [participateXlsData, vendorXlsData]
}