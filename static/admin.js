"use strict"

$(document).ready(function (){
    console.log("a")
    elencoRichieste()

    async function elencoRichieste() {
        const request = await inviaRichiesta("GET", "/api/getRichieste")
        if(request){
            console.log(request.data)
        }
    }
})