"use strict"

$(document).ready(function () {
    const aRegisterStudent = $("#register-student")
    const aRegisterTeacher = $("#register-teacher")
    const aLogin = $(".login")
    const loginSection = $("#login-section").show()
    const registerSectionTeacher = $("#register-section-teacher").hide()
    const registerSectionStudent = $("#register-section-student").hide()
    const btnAccedi = $("#btnLogin")
    const btnRegisterTeacher = $("#btnRegisterTeacher")
    const comboAnno = $("#anno")
    const comboSpecializzazione = $("#specializzazione")
    const comboMaterie = $("#materia")
    comboSpecializzazione.prop("disabled", true)
    comboMaterie.prop("disabled", true)

    aLogin.on("click", function () {
        loginSection.show()
        registerSectionStudent.hide()
        registerSectionTeacher.hide()
    })

    aRegisterTeacher.on("click", function () {
        loginSection.hide()
        registerSectionTeacher.show()
        registerSectionStudent.hide()
        getSpecializzazioni()
    })

    aRegisterStudent.on("click", function () {
        loginSection.hide()
        registerSectionTeacher.hide()
        registerSectionStudent.show()
    })

    comboAnno.on("change", function () {
        comboSpecializzazione.prop("selectedIndex", 0)
        comboMaterie.prop("selectedIndex", 0)
        const anno = $(this).val()
        if (anno != "placeholder") {
            comboSpecializzazione.prop("disabled", false)
        }
        else {
            comboSpecializzazione.prop("disabled", true)
        }
    })

    comboSpecializzazione.on("change", function () {
        const indirizzo = $(this).val();
        console.log(indirizzo, comboAnno.val())
        if (indirizzo != "placeholder") {
            comboMaterie.prop("disabled", false)
            if (comboAnno.val() != "placeholder")
                getMaterie(indirizzo, comboAnno.val())
        }
        else {
            comboMaterie.prop("disabled", true)
        }
    })

    comboMaterie.on("change", function () {
        const selectedValue = $(this).val();
    })

    $("#cv-upload").on("change", function () {
        const file = this.files[0];
        if (file && file.type !== "application/pdf") {
            Swal.fire({
                title: "Errore",
                text: "Il formato del CV non è valido!",
                footer: "Formati consentiti: .pdf",
                icon: "error"
            });
            $(".file-label").text("Inserisci il tuo CV *")
            .css("color", "#687aff")
            this.value = "";
        } else if(file && file.type == "application/pdf"){
            $(".file-label").text("PDF caricato correttamente: " + file.name)
                .css({
                    "color": "green",
                    "text-decoration": "none"
                })
        }
    })

    const input = document.getElementById('imageInput');
    const preview = document.getElementById('preview');

    input.addEventListener('change', function () {
        const file = this.files[0];

        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();

            reader.onload = function (e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };

            reader.readAsDataURL(file);
        } else {
            preview.style.display = 'none';
            this.value = ''; // reset input
            Swal.fire({
                title: "Errore",
                text: "Il formato dell'immagine non è valido!",
                footer: "Formati consentiti: .png, .jpg, .jpeg, .gif, .webp e .bmp",
                icon: "error"
            });
        }
    });

    btnRegisterTeacher.on("click", function () {
        const username = $("#username-teacher").val();
        const password = $("#password-teacher").val();
        const email = $("#email-teacher").val();
        const anno = comboAnno.val();
        const indirizzo = comboSpecializzazione.val();
        const materia = comboMaterie.val();
        const nTelefono = $(".telefono").val();
        const input = document.getElementById('cv-upload');
        const file = input.files[0];
        if (file) {
            console.log('✅ File caricato:', file.name);
            console.log('📦 Tipo:', file.type);
            console.log('📏 Dimensione:', file.size, 'byte');
        } else {
            console.log('❌ Nessun file selezionato.');
        }

    })

    async function getSpecializzazioni() {
        const request = await inviaRichiesta("GET", "/api/getSpecializzazioni")
        if (request) {
            console.log(request.data[0]["indirizzi"])
            for (const indirizzo in request.data[0]["indirizzi"]) {
                $("<option>")
                    .appendTo(comboSpecializzazione)
                    .prop({
                        "text": indirizzo,
                        "value": indirizzo
                    })
            }
        }
    }

    async function getMaterie(indirizzo, anno) {
        comboMaterie.empty()
        comboMaterie.append($("<option>").text("Materie *"))
        if (indirizzo && anno) {
            const request = await inviaRichiesta("GET", "/api/getMaterie", { indirizzo, anno })
            if (request) {
                request.data[0].forEach(materia => {
                    console.log(materia)
                    $("<option>").text(materia).val(materia).appendTo(comboMaterie)
                });
            }
        }
    }
})