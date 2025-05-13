"use strict"

$(document).ready(function () {
    elencoRichieste()

    async function elencoRichieste() {
        const request = await inviaRichiesta("GET", "/api/getRichieste")
        if (request) {
            request.data.forEach(richiestaProfessore => {
                const card = $("<div>").addClass("card-professore")
                card.append($("<h2>").text(`${richiestaProfessore.nome} ${richiestaProfessore.cognome}`))
                card.append($("<img>").prop("src", `data:image/png;base64,${richiestaProfessore.fotoProfiloBase64}`).css({ "width": "180px", "margin": "0 auto" }))
                card.append($("<p>").text(`📧 Email: ${richiestaProfessore.email}`))
                card.append($("<p>").text(`📘 Materia: ${richiestaProfessore.materia}`))
                card.append($("<p>").text(`📍 Città: ${richiestaProfessore.citta}`))
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
                buttonsContainer.append($("<button>").addClass("btn-accetta").text("Accetta").on("click", function () {
                    Swal.fire({
                        title: `Accetta la richiesta di ${richiestaProfessore.nome} ${richiestaProfessore.cognome}?`,
                        text: `Sei sicuro di voler accettare la richiesta?`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Sì',
                        cancelButtonText: 'No',
                    }).then((result) => {
                        if (result.isConfirmed) {
                            Swal.fire({
                                title: 'Richiesta accettata',
                                text: 'La richiesta è stata accettata con successo, mandare password generata casualmente via mail oppure al primo accesso cambiarla',
                                icon: 'success',
                            })
                        }
                        else{
                            Swal.fire({
                                title: 'Operazione annullata',
                                icon: 'info'
                            });
                        }
                    })
                }));
                buttonsContainer.append($("<button>").addClass("btn-rifiuta").text("Rifiuta").on("click", function () {
                    Swal.fire({
                        title: `Sei sicuro di rifiutare la richiesta di ${richiestaProfessore.nome} ${richiestaProfessore.cognome}?`,
                        html: `
                                Non potrai più contattare ${richiestaProfessore.nome} ${richiestaProfessore.cognome},
                                a meno che non sia lui a mandare nuovamente una richiesta di iscrizione alla piattaforma!<br><br>
                                <textarea id="motivazioneText" placeholder="Lascia una motivazione" style="width: 90%; height: 150px;"></textarea>
                              `,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Conferma',
                        cancelButtonText: 'Annulla',
                        focusConfirm: false,
                        preConfirm: () => {
                            const motivazione = document.getElementById("motivazioneText").value.trim()
                            if (!motivazione) {
                                Swal.showValidationMessage("Inserire una motivazione");
                                return false;
                            }
                            return motivazione;
                        }
                    }).then(async (result) => {
                        if (result.isConfirmed) {
                            const motivazione = result.value;
                            Swal.fire({
                                title: `Richiesta rifiutata!`,
                                html: `<b>Motivo</b>: ${motivazione}`,
                                icon: 'info'
                            });

                            let mail = {
                                to: richiestaProfessore.email,
                                subject: "Richiesta di iscrizione rifiutata",
                                message: `Ciao ${richiestaProfessore.nome} ${richiestaProfessore.cognome}, la tua richiesta di registrazione alla piattaforma
                                         è stata rifiutata. Motivo: ${motivazione}
                                         `,
                            }

                            /*let response = await inviaRichiesta('POST', '/api/newMail', mail);
                            if (response.status == 200) {
                                console.log(response.data);
                                alert('Mail inviata correttamente');
                            } else alert(response.status + ' : ' + response.err);*/
                        } else {
                            Swal.fire({
                                title: 'Operazione annullata',
                                icon: 'info'
                            });
                        }
                    });

                }));

                card.append(buttonsContainer);
                $("#contenitore-professori").append(card)
            });
        }
    }
})