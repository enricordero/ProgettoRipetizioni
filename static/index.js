"use strict"

window.onload = function () {
    const elencoIndirizzi = $("#elencoIndirizzi")
    const divCourses = $("#courses")
    let materie = []

    getIndirizzi()
    getMiglioriProfessori()

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
                div.find("img").css({ "filter": "brightness(50%)", "transition": "all 400ms" })
                    .on("mouseover", function () {
                        $(this).css({ "filter": "brightness(100%)" })
                    })
                    .on("mouseout", function () {
                        $(this).css({ "filter": "brightness(50%)", "transition": "all 400ms" })
                    });
                div.show(400)
                $(".event_box").css("height", "100%")
            });
        }
    }

    async function getMiglioriProfessori() {
        const request = await inviaRichiesta("GET", "/api/getBestProfessors")
        if (request) {
            let professori = request.data;
            professori.forEach(professore => {
                let div1 = $("<div>").prop("title", "Vedi il profilo").addClass("col-lg-3 col-md-6").appendTo(".professori")
                let div2 = $("<div>").addClass("team-member").appendTo(div1)
                let div3 = $("<div>").addClass("main-content").appendTo(div2)
                $("<img>").prop({ "src": "assets/images/defaultPfp.jpg", "alt": "" }).appendTo(div3)
                $("<span>").text(professore["materia"]).addClass("category").appendTo(div3)
                $("<h4>").text(professore["nome"] + " " + professore["cognome"]).appendTo(div3)
                let starContainer = $("<div>").addClass("star-container").appendTo(div3)
                let mediaVoti = professore["sommaValutazioni"] / professore["numeroValutazioni"]
                let nStelle = arrotondaVoto(mediaVoti)
                for (let i = 0; i < nStelle; i++) {
                    $("<img>").prop({ "src": "assets/images/gold-star.png", "alt": "" }).appendTo(starContainer)
                }
                for (let i = 0; i < 5 - nStelle; i++) {
                    $("<img>").prop({ "src": "assets/images/grey-star.png", "alt": "" }).appendTo(starContainer)
                }
                let votoFormattato = mediaVoti % 1 === 0 ? mediaVoti.toFixed(0) : mediaVoti.toFixed(1);
                $("<div>").text("Valutazione: " + votoFormattato + "/5").appendTo(div3);
            })
        }
    }

    function arrotondaVoto(voto) {
        const decimale = voto - Math.floor(voto);
        return decimale < 0.6 ? Math.floor(voto) : Math.ceil(voto);
    }
}