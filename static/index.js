"use strict"

window.onload = function () {
    const elencoIndirizzi = $("#elencoIndirizzi")
    const divCourses = $("#courses")
    let materie = []

    getIndirizzi()

    divCourses.find(".event_filter").find("a").on("click", function () {
        let indirizzo = ($(this).prop("id"))
        let sigla = $(this).text()
        getMateriePerIndirizzo(indirizzo, sigla)
    })

    async function getIndirizzi() {
        const request = await inviaRichiesta("GET", "/api/getSpecializzazioni")
        if (request) {
            for (const indirizzo in request.data[0]["indirizzi"]) {
                elencoIndirizzi.append(`<li>•${indirizzo}</li>`)
            }
        }
    }

    async function getMateriePerIndirizzo(indirizzo, sigla) {
        $(".event_box").empty()
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
                const div = $(`
                    <div class="col-lg-4 col-md-6 align-self-center mb-30 event_outer ${sigla.toLowerCase()}">
                        <div class="events_item">
                            <div class="thumb">
                                <a href="#"><img class="imgMateria" src="assets/images/subjects/${materia.toLowerCase()}.jpg" alt=""></a>
                                <span class="category">${materia}</span>
                            </div>
                            <div class="down-content">
                                <span class="author">${indirizzo}</span>
                                <h4>${materia}</h4>
                            </div>
                        </div>
                    </div>
                `);
                div.hide()
                div.appendTo(".event_box")
                div.find("img").css({"filter": "brightness(50%)", "transition": "all 400ms"})
                .on("mouseover",function(){
                    $(this).css({"filter": "brightness(100%)"})
                })
                .on("mouseout",function(){
                    $(this).css({"filter": "brightness(50%)", "transition": "all 400ms"})
                });
                div.show(400)
                $(".event_box").css("height", "100%")
            });
        }
    }
}