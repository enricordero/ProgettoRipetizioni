"use strict"

$(document).ready(function () {
    const codice = sessionStorage.getItem("codice")
    console.log(codice)
    if (codice != "admin") {
        Swal.fire({
            title: "Accesso non autorizzato",
            text: "Non hai i permessi necessari per accedere a questa pagina oppure non hai eseguito l'accesso",
            icon: "error",
            confirmButtonText: "Ok",
        }).then(() => {
            window.location.href = "./login.html"
        })
    }
    else {
        elencoRichieste()

        async function elencoRichieste() {
            const request = await inviaRichiesta("GET", "/api/getRichieste")
            if (request) {
                request.data.forEach(richiestaProfessore => {
                    const card = $("<div>").addClass("card-professore")
                    card.append($("<h2>").text(`${richiestaProfessore.nome} ${richiestaProfessore.cognome}`))
                    card.append($("<p>").text(`📧 Email: ${richiestaProfessore.email}`))
                    card.append($("<p>").text(`📘 Materia: ${richiestaProfessore.materia}`))
                    card.append($("<p>").text(`📍 Città: ${richiestaProfessore.citta}`))
                    card.append($("<p>").text(`🕒 Disponibilità: ${richiestaProfessore.scelte.join(", ")}`))
                    card.append(
                        $("<a>")
                            .text("📄 Vedi curriculum")
                            .addClass("btn-link")
                            .on("click", function () {
                                apriPdf(richiestaProfessore.cvBase64)
                            })
                            .on("mouseover", function () {
                                $(this).css("cursor", "pointer");
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
                        }).then(async (result) => {
                            if (result.isConfirmed) {
                                Swal.fire({
                                    title: 'Richiesta accettata',
                                    text: 'Richiesta accettata con successo, password generata casualmente mandata via whatsapp',
                                    icon: 'success',
                                })

                                deleteRequest(richiestaProfessore._id)

                                let password = generaPasswordCasuale()

                                let account = {
                                    email: richiestaProfessore.email,
                                    password: password,
                                    nome: richiestaProfessore.nome,
                                    cognome: richiestaProfessore.cognome,
                                    materia: richiestaProfessore.materia,
                                    scelte: richiestaProfessore.scelte,
                                    citta: richiestaProfessore.citta,
                                    telefono: richiestaProfessore.telefono,
                                    numeroValutazioni: 0,
                                    sommaValutazioni: 0
                                }

                                creaUtenteProfessore(account)

                                const numero = richiestaProfessore.telefono;
                                const messaggio = encodeURIComponent(
                                    `Gentile utente,\nla informiamo che la sua richiesta di registrazione alla piattaforma SkillUp è stata approvata e il suo account è stato creato con successo.\n\nDi seguito le credenziali per effettuare l'accesso:\n*Email*: ${richiestaProfessore.email}\n*Password*: ${password}\n_(la password è stata generata casualmente)_`
                                );
                                window.open(`https://wa.me/${numero}?text=${messaggio}`, '_blank');


                            }
                            else {
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
                                    html: `<b>Motivazione</b>: ${motivazione}`,
                                    icon: 'info'
                                });

                                deleteRequest(richiestaProfessore._id)

                                const numero = richiestaProfessore.telefono;
                                const messaggio = encodeURIComponent(
                                    `Gentile utente,\nla informiamo che la sua richiesta di registrazione alla piattaforma SkillUp è stata rifiutata.\n\n*Motivazione*: ${motivazione}`
                                );
                                window.open(`https://wa.me/${numero}?text=${messaggio}`, '_blank');

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

        function generaPasswordCasuale() {
            const caratteri = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let password = '';
            for (let i = 0; i < 16; i++) {
                const indiceCasuale = Math.floor(Math.random() * caratteri.length);
                password += caratteri.charAt(indiceCasuale);
            }
            return password;
        }

        async function deleteRequest(id) {
            const request = await inviaRichiesta("DELETE", "/api/deleteRequest", { id })
            if (request.status == 200) {
                console.log("Richiesta cancellata dal database")
            }
        }

        async function creaUtenteProfessore(account) {
            const request = await inviaRichiesta("POST", "/api/creaUtenteProfessore", { account });
            if (request.data) {
                console.log("Account creato:", account);
            } else {
                alert("Errore durante la creazione dell'account");
            }
        }
    }
})