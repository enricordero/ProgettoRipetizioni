"use strict"

window.onload = function () {
    const elencoIndirizzi = $("#elencoIndirizzi")

    getIndirizzi()

    async function getIndirizzi() {
        const request = await inviaRichiesta("GET", "/api/getSpecializzazioni")
        if (request) {
            for (const indirizzo in request.data[0]["indirizzi"]) {
                console.log(indirizzo)
                elencoIndirizzi.append(`<li>•${indirizzo}</li>`)
            }
        }
    }
}