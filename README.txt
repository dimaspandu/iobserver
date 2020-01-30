PLATFORM:: 
NODE.JS

RUN COMMAND:: 
"node index.js"

CONFIGURATION::
konfigurasi email dan mysql ada pada file .env

DB SCHEMA::
contoh schema table ada pada file src/sql/main.sql 
(table harus dibuat terlebih dahulu sesuai schema tersebut, karena program tidak membuat table)

DESCRIPTION:: 
program akan mengakses 2 email terbaru yang pada subject-nya masing-masing mengandung kalimat "Participate_ISUPPLIER" dan 
"Vendor_ISUPPLIER", program kemudian akan mengunduh attachment yang ada pada masing-masing file, mengkases file excel 
yang ada di dalamnya dan menyimpannya ke table database yang sesuai dengan schema yang ada pada src/sql/main.sql