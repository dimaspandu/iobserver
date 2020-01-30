 **PLATFORM : :**  
node.js, mysql

**RUN COMMAND : :**
> `npm install` - *install dependencies*
> `node index.js` - *run program*

**CONFIGURATION : :**
konfigurasi email dan mysql ada pada file `.env`
  
**DB SCHEMA : :**
contoh schema table ada pada file `src/sql/main.sql`
(<font color="red">**\***</font> *table harus dibuat terlebih dahulu sesuai schema tersebut, karena program tidak membuat table*)

**DESCRIPTION : :**
program akan mengakses 2 email terbaru yang pada subject-nya masing-masing mengandung kalimat *Participate_ISUPPLIER* dan *Vendor_ISUPPLIER*, program kemudian akan mengunduh lampiran yang ada pada masing-masing email, mengkases file excel yang ada di dalamnya dan menyimpannya ke table database yang sesuai dengan schema yang ada pada `src/sql/main.sql`