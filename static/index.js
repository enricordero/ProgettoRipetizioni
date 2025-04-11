"use strict"

window.onload = function () {
    const elencoIndirizzi = $("#elencoIndirizzi")
    const divCourses = $("#courses")
    let materie = []

    getIndirizzi()

    divCourses.find(".event_filter").find("a").on("click", function () {
        let indirizzo = ($(this).prop("id"))
        getMateriePerIndirizzo(indirizzo)
    })

    async function getIndirizzi() {
        const request = await inviaRichiesta("GET", "/api/getSpecializzazioni")
        if (request) {
            for (const indirizzo in request.data[0]["indirizzi"]) {
                elencoIndirizzi.append(`<li>•${indirizzo}</li>`)
            }
        }
    }

    async function getMateriePerIndirizzo(indirizzo) {
        const request = await inviaRichiesta("GET", "/api/getMateriePerIndirizzo", { indirizzo })
        if (request) {
            for (const item of request.data) {
                materie = [];
                for (const anno in item) {
                    item[anno].forEach(materia => {
                        if (!materie.includes(materia)) {
                            materie.push(materia);
                        }
                    });
                }
            }
            materie.forEach(materia => {
                console.log(materia)
            });
        }
    }
}