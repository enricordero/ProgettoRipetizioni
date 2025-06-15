"use strict"

async function getRecensioni() {
    const request = await inviaRichiesta("GET", "/api/getRecensioni");

    if (request.status === 200) {
        const carousel = $("#carouselRecensioni");
        carousel.empty();

        request.data.forEach(recensione => {
            let divItem = $("<div>").addClass("item");
            $("<p>").text(`“${recensione.messaggio}”`).appendTo(divItem);
            let divAuthor = $("<div>").addClass("author").appendTo(divItem);
            $("<img>").attr({ src: "assets/images/defaultPfp.jpg", alt: "" }).appendTo(divAuthor);
            let dataISO = recensione.data;
            let dataFormattata = new Date(dataISO).toLocaleDateString('it-IT');
            $("<span>").addClass("category").text(dataFormattata + " - " + recensione.codice).appendTo(divAuthor);
            $("<h4>").text(`${recensione.nome} ${recensione.cognome}`).appendTo(divAuthor);
            carousel.append(divItem);
        });

        carousel.owlCarousel({
            items: 1,
            loop: true,
            margin: 30,
            autoplay: true,
            autoplayTimeout: 5000,
            autoplayHoverPause: true,
            nav: true,
            navText: [
                '<i class="fa fa-chevron-left"></i>',
                '<i class="fa fa-chevron-right"></i>'
            ],
            dots: true
        });

    }
}



window.onload = function () {
    const codice = sessionStorage.getItem("codice");
    const currentPage = window.location.pathname.split("/").pop();

    if ((codice === null || codice.trim() === "") && currentPage !== "login.html") {
        alert("Effettua il login per proseguire")
        window.location.href = "./login.html";
    }
    const elencoIndirizzi = $("#elencoIndirizzi")
    const divCourses = $("#courses")
    let materie = []
    const loggedUserId = localStorage.getItem("userId");
    if (loggedUserId) {
        console.log("Utente loggato con ID:", loggedUserId);
        getDatiUtente(loggedUserId)
    } else {
        console.log("Nessun utente loggato");
    }


    getIndirizzi()
    getMiglioriProfessori()
    getRecensioni()

    divCourses.find(".event_filter").find("a").on("click", function () {
        let indirizzo = ($(this).prop("id"))
        let sigla = $(this).text()
        getMateriePerIndirizzo(indirizzo, sigla)
    })

    $("#report-feedback").on("click", function () {
        Swal.fire({
            title: "Lascia una recensione",
            background: "#5163e8",
            color: "#fff",
            html: `
                    <div>
                        <textarea name="message" id="message" placeholder="Lascia un messaggio..."></textarea>
                    </div>    
                        <style>
                        input {
                            width: 100%;
                            height: 50px;
                            border-radius: 25px;
                            background-color: rgba(249, 235, 255, 0.15);
                            border: none;
                            outline: none;
                            font-weight: 300;
                            padding: 0px 20px;
                            font-size: 14px;
                            color: #fff;
                            margin-bottom: 30px;
                            position: relative;
                            z-index: 3;
                        }

                        input::placeholder {
                            color: #fff;
                        }

                        textarea {
                            width: 100%;
                            height: 120px;
                            border-radius: 25px;
                            background-color: rgba(249, 235, 255, 0.15);
                            border: none;
                            outline: none;
                            font-weight: 300;
                            padding: 20px;
                            font-size: 14px;
                            color: #fff;
                            margin-bottom: 30px;
                            position: relative;
                            z-index: 3;
                        }

                        textarea::placeholder {
                            color: #fff;
                        }
                    </style>
                `,
            confirmButtonText: "Invia",
            showCancelButton: true,
            cancelButtonText: "Annulla",
            buttonsStyling: false,
            customClass: {
                confirmButton: 'btn-custom-invia',
                cancelButton: 'btn-custom-annulla'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                if (loggedUserId != null) {
                    const message = document.getElementById("message").value;
                    let tipoUtente
                    if (codice == "students") {
                        tipoUtente = "Studente"
                    }
                    else if (codice == "teachers") {
                        tipoUtente = "Insegnante"
                    }

                    let nuovaRecensione = {
                        codice: tipoUtente,
                        cognome: localStorage.getItem("cognomeUtente"),
                        nome: localStorage.getItem("nomeUtente"),
                        data: new Date(),
                        messaggio: message,
                    }

                    console.log(nuovaRecensione)
                    const request = await inviaRichiesta("POST", "/api/nuovaRecensione", { nuovaRecensione })
                    if (request.status == 200) {
                        Swal.fire('Grazie!', 'La tua recensione è stata registrata', 'success');
                    }
                }
            }
        });

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
        $(".event_box").show()
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
                    <div class="col-lg-4 col-md-6 align-self-center mb-30 event_outer">
                        <div class="events_item">
                            <div class="thumb">
                                <a onclick=cercaProfessoriPerMateria('${materia.toLowerCase().trim().replace(/\s+/g, "_")}')><img class="imgMateria" src="assets/images/subjects/${materia.toLowerCase()}.jpg" alt=""></a>
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

    async function getDatiUtente(id) {
        const response = await inviaRichiesta("GET", "/api/getUtente", { id, collectionName: codice })
        if (response.status == 200) {
            console.log(response.data)
            localStorage.setItem("nomeUtente", response.data.nome)
            localStorage.setItem("cognomeUtente", response.data.cognome)
        }
    }
}

function creaElencoProfessori(professori) {
    professori.forEach(professore => {
        let div1 = $("<div>").prop("title", "Vedi il profilo").addClass("col-lg-3 col-md-6").appendTo(".professori")
        let div2 = $("<div>").addClass("team-member").appendTo(div1)
        let div3 = $("<div>").addClass("main-content").appendTo(div2)
        $("<img>").prop({ "src": "data:image/jpg;base64," + professore["fotoProfilo"], "alt": "" })
            .on("error", function () {
                $(this).prop({ "src": "assets/images/defaultPfp.jpg", "alt": "" })
            })
            .on("click", function () {
                Swal.fire({
                    title: professore["nome"] + " " + professore["cognome"],
                    html: `
                            <div style="text-align: left; font-size: 16px;">
                                <p><strong>Email:</strong> ${professore["email"]}</p>
                                <p><strong>Materia:</strong> ${professore["materia"]}</p>
                                <p><strong>Città:</strong> ${professore["citta"]}</p>
                                <p><strong>A disposizione:</strong> ${professore["scelte"]?.join(", ") || "Non specificato"}</p>
                                <p><strong>Media:</strong> ${professore["numeroValutazioni"] > 0
                            ? (function () {
                                const media = professore["sommaValutazioni"] / professore["numeroValutazioni"];
                                return Number.isInteger(media) ? media + "/5" : media.toFixed(1) + "/5";
                            })()
                            : "N.D."
                        }</p>
                                        
                                ${professore["scelte"]?.includes("Difficolta")
                            ? `
                                    <hr style="margin: 20px 0;">
                                    <h4 style="color: #5163e8; margin-bottom: 5px;">Eventuali note</h4>
                                    <p>Il tutor accetta ragazzi con difficoltà nell'apprendimento.</p>
                                    `
                            : ""
                        }
                                        
                                <hr style="margin: 20px 0;">
                                <h4 style="color: #5163e8; margin-bottom: 5px;">Contatti</h4>
                                <p><strong>Email:</strong> ${professore["email"]}</p>
                                <p><strong>Telefono:</strong> ${professore["telefono"]}</p>
                            </div>
                        `,
                    showCancelButton: true,
                    confirmButtonText: "Chiudi",
                    cancelButtonText: "Dai una valutazione",
                    reverseButtons: true,
                    width: 600,
                    background: '#f4f6ff',
                    customClass: {
                        popup: 'swal2-card',
                        title: 'swal2-title-custom'
                    }
                }).then((result) => {
                    if (result.dismiss === Swal.DismissReason.cancel) {
                        Swal.fire({
                            title: 'Valuta il professore',
                            html: `
                                <style>
                                    .star {
                                        font-size: 40px;
                                        color: lightgray;
                                        cursor: pointer;
                                        transition: color 0.2s;
                                        user-select: none;
                                    }
                                    .star.hover, .star.selected {
                                        color: gold;
                                    }
                                </style>
                                <div id="stars-container" style="text-align:center;">
                                    <span class="star" data-value="1">&#9733;</span>
                                    <span class="star" data-value="2">&#9733;</span>
                                    <span class="star" data-value="3">&#9733;</span>
                                    <span class="star" data-value="4">&#9733;</span>
                                    <span class="star" data-value="5">&#9733;</span>
                                </div>
                            `,
                            showCancelButton: true,
                            confirmButtonText: 'Invia',
                            cancelButtonText: 'Annulla',
                            preConfirm: () => {
                                const selectedStars = document.querySelectorAll('.star.selected');
                                if (!selectedStars.length) {
                                    Swal.showValidationMessage('Per favore seleziona una valutazione');
                                    return false;
                                }
                                const lastSelectedStar = selectedStars[selectedStars.length - 1];
                                return lastSelectedStar.getAttribute('data-value');
                            }
                        }).then(async (res) => {
                            if (res.isConfirmed) {
                                const request = await inviaRichiesta("PATCH", "/api/aggiornaValutazione", { id: professore._id, valutazione: res.value })
                                if (request.status == 200) {
                                    Swal.fire('Grazie!', 'La tua valutazione è stata registrata.', 'success');
                                    getMiglioriProfessori()
                                }
                            }
                        });

                        const starsContainer = document.getElementById('stars-container');
                        if (starsContainer) {
                            const stars = starsContainer.querySelectorAll('.star');
                            stars.forEach(star => {
                                star.addEventListener('mouseenter', () => {
                                    const val = parseInt(star.getAttribute('data-value'));
                                    stars.forEach(s => {
                                        s.classList.toggle('hover', parseInt(s.getAttribute('data-value')) <= val);
                                    });
                                });
                                star.addEventListener('mouseleave', () => {
                                    stars.forEach(s => s.classList.remove('hover'));
                                });
                                star.addEventListener('click', () => {
                                    const val = parseInt(star.getAttribute('data-value'));
                                    stars.forEach(s => {
                                        s.classList.toggle('selected', parseInt(s.getAttribute('data-value')) <= val);
                                    });
                                });
                            });
                        }
                    }
                });

            })
            .appendTo(div3)
        $("<span>").text(professore["materia"]).addClass("category").appendTo(div3)
        $("<h4>").text(professore["nome"] + " " + professore["cognome"]).appendTo(div3)
        let starContainer = $("<div>").addClass("star-container").appendTo(div3)
        let mediaVoti = 0
        if (professore["numeroValutazioni"] != 0) {
            mediaVoti = professore["sommaValutazioni"] / professore["numeroValutazioni"]
        }
        let nStelle = arrotondaVoto(mediaVoti)
        for (let i = 0; i < nStelle; i++) {
            $("<img>").prop({ "src": "assets/images/gold-star.png", "alt": "" }).appendTo(starContainer)
        }
        for (let i = 0; i < 5 - nStelle; i++) {
            $("<img>").prop({ "src": "assets/images/grey-star.png", "alt": "" }).appendTo(starContainer)
        }
        let votoFormattato = mediaVoti % 1 === 0 ? mediaVoti.toFixed(0) : mediaVoti.toFixed(1);
        let p = $("<p>").prop("id", "container").css("text-align", "left").appendTo(div3)
        $("<div>").html("<b>Valutazione: </b>" + votoFormattato + "/5").appendTo(p);
        $("<div>").html("<b>Numero di valutazioni: </b>" + professore["numeroValutazioni"]).appendTo(p);
        $("<div>").html("<b>Modalità: </b>" +
            (Array.isArray(professore["scelte"]) ? professore["scelte"].join(", ") : "Non specificato")
        ).appendTo(p);
        $("<div>").html("<b>Città: </b>" + professore["citta"]).appendTo(p);
    });
}

function arrotondaVoto(voto) {
    const decimale = voto - Math.floor(voto);
    return decimale < 0.6 ? Math.floor(voto) : Math.ceil(voto);
}

async function cercaProfessoriPerMateria(materia) {
    let formattedMateria = materia.toLowerCase().trim().replace(/_/g, "")
    const request = await inviaRichiesta("GET", "/api/getProfessoriPerMateria", { materia: formattedMateria })
    $(".professori").empty()
    creaElencoProfessori(request.data)
    $(".event_box").hide()
    if (request.data.length === 0) {
        let materiaLeggibile = materia.replace(/_/g, " ").toLowerCase().trim();
        $(".professori").html(`Al momento non ci sono professori registrati per la materia <b>${materiaLeggibile}</b>`);
    }

}

async function getMiglioriProfessori() {
    const request = await inviaRichiesta("GET", "/api/getBestProfessors")
    if (request.data.length > 0) {
        $(".professori").empty()
        creaElencoProfessori(request.data)
    }
}
