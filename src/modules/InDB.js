require('dotenv').config()
const mysql = require('mysql')

const setCallback = function (callback) {
    if (callback !== undefined) callback()
}

const pool = mysql.createPool({
    connectionLimit: 4,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,

});

const getConnection = function () {
    return new Promise((resolve, reject) => {
        pool.getConnection((error, connection) => {
            if (error) {
                reject(error)

                return
            }

            resolve(connection)
        })
    })
}

const sqlQuery = function ({ connection, sql }) {
    return new Promise((resolve, reject) => {
        connection.query(sql, function (error, results, fields) {
            if (error) {
                reject(error)

                return
            }

            resolve({ results, fields })
        })
    })
}

const sqlInsertSupplierEventDetail = function ({ connection, values }) {
    return new Promise((resolve, reject) => {
        console.log("INSERT INTO isupplier_event_detail...")

        connection.query("INSERT INTO isupplier_event_detail (entity, supplier_name, event_title, date, suplier_fact, events_participated, events_awarded) VALUES ?", values, function (error, results, fields) {
            if (error) {
                reject(error)

                return
            }

            resolve(results)

            console.log("INSERT INTO isupplier_event_detail success")
        })
    })
}

const sqlInsertSupplierSPMScoringDetail = function ({ connection, values }) {
    return new Promise((resolve, reject) => {
        console.log("inserting data into isupplier_spm_scoring_detail...")

        connection.query("INSERT INTO isupplier_spm_scoring_detail (entity, commodity, erp_suplier, project_name, user, kpi, performance_period_from_year, performance_period_from_month, performance_period_to_year, performance_period_to_month, average_grade) VALUES ?", values, function (error, results, fields) {
            if (error) {
                reject(error)

                return
            }

            resolve(results)

            console.log("insert into isupplier_spm_scoring_detail success")
        })
    })
}

const sqlTruncateSupplierEventDetail = async function (connection) {
    await sqlQuery({ connection, sql: ("TRUNCATE TABLE isupplier_event_detail") })

    console.log("TRUNCATE isupplier_event_detail success")
}

const sqlTruncateSPMScoringDetail = async function (connection) {
    await sqlQuery({ connection, sql: ("TRUNCATE TABLE isupplier_spm_scoring_detail") })

    console.log("TRUNCATE isupplier_spm_scoring_detail success")
}

function constructMySQLInsertSupplierEventDetailValuesArray(records) {
    const mysqlInsertValuesArray = records.map(record => {
        return [
            record["[EPT] Entity"],
            record["[SUP/CUS]Supplier/Customer (Supplier Name (L10))"],
            record["[EPT]Event Information (Event Title)"],
            reformatDate(record["[EPT]Event Create Date (Date)"]),
            parseInt(record["count(SupplierFact)"]),
            parseInt(record["sum(Events Participated)"]),
            parseInt(record["sum(Events Awarded)"])
        ]
    })

    return [mysqlInsertValuesArray]
}

function constructMySQLInsertSupplierSPMScoringDetailValuesArray(records) {
    const mysqlInsertValuesArray = records.map(record => {
        const averageGrade = parseInt(record["sum(if(Average Grade<=0.0,0.0,Average Grade Count<=0.0,0.0,Average Grade))"]) / parseInt(record["sum(if(Average Grade Count<=0.0,0.0,Average Grade Count))"]) || 0

        return [
            record["Entity"],
            record["Commodity - Commodity (L1)"],
            record["Supplier - ERP Supplier"],
            record["Project - Project Name"],
            record["Owner - User"],
            record["KPI - KPI"],
            reformatDate(record["Performance Period From - Date"]),
            reformatDate(record["Performance Period From - Date"]),
            reformatDate(record["Performance Period To - Date"]),
            reformatDate(record["Performance Period To - Date"]),
            averageGrade
        ]
    })

    return [mysqlInsertValuesArray]
}

const reformatDate = (date) => {
    let segment = date.split('/')

    return segment[2] + '-' + segment[0] + '-' + segment[1]
}

const processData = async function (connection, { title, records }) {
    if (!title) {
        throw new TypeError("title parameter is null/undefined")
    }

    if (!records || !records.length) {
        throw new TypeError("null/undefined")
    }

    let mysqlTruncateFunction
    let mysqlInsertFunction
    let mysqlInsertValues

    if (title === "Monitoring_Supplier Participate_ISUPPLIER") {
        mysqlTruncateFunction = sqlTruncateSupplierEventDetail
        mysqlInsertFunction = sqlInsertSupplierEventDetail
        mysqlInsertValues = constructMySQLInsertSupplierEventDetailValuesArray(records)
    }

    if (title === "Monitoring_SPM Reports by Vendor_ISUPPLIER") {
        mysqlTruncateFunction = sqlTruncateSPMScoringDetail
        mysqlInsertFunction = sqlInsertSupplierSPMScoringDetail
        mysqlInsertValues = constructMySQLInsertSupplierSPMScoringDetailValuesArray(records)
    }

    if (!mysqlInsertValues || !mysqlInsertValues.length) {
        throw new Error("something went wrong, sql insert values array is empty/null/undefined")
    }

    await mysqlTruncateFunction(connection)

    await mysqlInsertFunction({ connection, values: mysqlInsertValues })
}

exports.run = async function (xlsData) {
    const connection = await getConnection()

    for (data of xlsData) {
        await processData(connection, data)
    }

    connection.release()
    pool.end()
}