"use strict"

$(document).ready(function () {
    console.log("a")
    elencoRichieste()

    async function elencoRichieste() {
        const request = await inviaRichiesta("GET", "/api/getRichieste")
        if (request) {
            request.data.forEach(richiesta => {
                console.log(richiesta)
                const card = $("<div>").addClass("card-professore")
                card.append($("<h2>").text(`${richiesta.nome} ${richiesta.cognome}`))
                card.append($("<p>").text(`📍 Città: ${richiesta.citta}`))
                card.append($("<p>").text(`📧 Email: ${richiesta.email}`))
                card.append($("<p>").text(`📘 Materia: ${richiesta.materia}`))
                card.append(
                    $("<a>")
                      .text("📄 Vedi curriculum")
                      .addClass("btn-link")
                      .prop("href", "#")
                  );
                  
                  const buttonsContainer = $("<div>").addClass("button-group");
                  buttonsContainer.append($("<button>").addClass("btn-accetta").text("Accetta"));
                  buttonsContainer.append($("<button>").addClass("btn-rifiuta").text("Rifiuta"));
                  
                  card.append(buttonsContainer);
                $("#contenitore-professori").append(card)
            });
        }
    }
})