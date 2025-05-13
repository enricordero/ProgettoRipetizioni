"use strict"

$(document).ready(function () {
    console.log("a")
    elencoRichieste()

    async function elencoRichieste() {
        const request = await inviaRichiesta("GET", "/api/getRichieste")
        if (request) {
            request.data.forEach(richiestaProfessore => {
                console.log(richiestaProfessore)
                const card = $("<div>").addClass("card-professore")
                card.append($("<h2>").text(`${richiestaProfessore.nome} ${richiestaProfessore.cognome}`))
                card.append($("<p>").text(`📍 Città: ${richiestaProfessore.citta}`))
                card.append($("<p>").text(`📧 Email: ${richiestaProfessore.email}`))
                card.append($("<p>").text(`📘 Materia: ${richiestaProfessore.materia}`))
                card.append($("<img>").prop("src", `data:image/png;base64,${richiestaProfessore.fotoProfiloBase64}`).css({"width": "180px", "margin": "0 auto"}))
                card.append(
                    $("<a>")
                        .text("📄 Vedi curriculum")
                        .addClass("btn-link")
                        .prop(
                            {
                                "href": "#",
                                "target": "_blank"
                            }
                        )
                        .on("click", function () {
                            apriPdf(richiestaProfessore.cvBase64)
                        })
                );
                function apriPdf(base64) {
                    const byteCharacters = atob(base64);
                    const byteNumbers = new Array(byteCharacters.length).fill().map((_, i) => byteCharacters.charCodeAt(i));
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'application/pdf' });
                    const blobUrl = URL.createObjectURL(blob);
                    window.open(blobUrl, '_blank');
                }


                const buttonsContainer = $("<div>").addClass("button-group");
                buttonsContainer.append($("<button>").addClass("btn-accetta").text("Accetta"));
                buttonsContainer.append($("<button>").addClass("btn-rifiuta").text("Rifiuta"));

                card.append(buttonsContainer);
                $("#contenitore-professori").append(card)
            });
        }
    }
})