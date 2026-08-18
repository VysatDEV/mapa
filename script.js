/* =========================================
   SUPABASE
========================================= */

const SUPABASE_URL =
    "https://gdwxvydufgiucnqkzhrj.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_BXHNLKyR73HI6orGoSzqgA_-JbhvnLE";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================
   DATA
========================================= */

let provinces = [];

let statistics = {};

let selectedProvince = null;


/* =========================================
   ELEMENTY
========================================= */

const mapArea =
    document.getElementById("mapArea");

const mapContainer =
    document.getElementById("mapContainer");

const map =
    document.getElementById("map");

const svg =
    document.getElementById("svg");

const status =
    document.getElementById("status");


/* =========================================
   ZOOM / PAN
========================================= */

let scale = 1;

let offsetX = 0;

let offsetY = 0;

let dragging = false;

let dragStartX = 0;

let dragStartY = 0;

let startOffsetX = 0;

let startOffsetY = 0;


/* =========================================
   NAČTENÍ PROVINCIÍ
========================================= */

async function loadProvinces() {

    const {
        data,
        error
    } = await supabaseClient
        .from("provinces")
        .select("*");


    if (error) {

        console.error(
            "Chyba při načítání provincií:",
            error
        );

        throw error;

    }


    provinces =
        data || [];


    console.log(
        "Načtené provincie:",
        provinces
    );

}


/* =========================================
   NAČTENÍ STATISTIK
========================================= */

async function loadStatistics() {

    const {
        data,
        error
    } = await supabaseClient
        .from("province_stats")
        .select("*");


    if (error) {

        console.error(
            "Chyba při načítání statistik:",
            error
        );

        throw error;

    }


    statistics = {};


    /*
     * Převod:
     *
     * [
     *   {
     *      name: "44",
     *      obili: 100
     *   }
     * ]
     *
     * na:
     *
     * statistics["44"]
     */

    (data || []).forEach(
        function(stats) {

            statistics[
                String(stats.name)
            ] = stats;

        }
    );


    console.log(
        "Načtené statistiky:",
        statistics
    );

}


/* =========================================
   NAČTENÍ VŠEHO
========================================= */

async function loadData() {

    try {

        status.textContent =
            "Načítám data ze Supabase...";


        await loadProvinces();

        await loadStatistics();


        status.textContent =
            "Načteno " +
            provinces.length +
            " provincií";


        drawProvinces();

    }

    catch(error) {

        console.error(error);


        status.textContent =
            "Chyba při načítání databáze";

    }

}


/* =========================================
   MAPA
========================================= */

map.addEventListener(
    "load",
    function() {

        mapContainer.style.width =
            map.naturalWidth + "px";


        mapContainer.style.height =
            map.naturalHeight + "px";


        svg.setAttribute(
            "width",
            map.naturalWidth
        );


        svg.setAttribute(
            "height",
            map.naturalHeight
        );


        centerMap();

        drawProvinces();

    }
);


/* =========================================
   CENTER MAP
========================================= */

function centerMap() {

    if (!map.naturalWidth)
        return;


    scale = 1;


    offsetX =
        (
            window.innerWidth -
            map.naturalWidth
        ) / 2;


    offsetY =
        (
            window.innerHeight -
            map.naturalHeight
        ) / 2;


    updateTransform();

}


/* =========================================
   TRANSFORM
========================================= */

function updateTransform() {

    mapContainer.style.transform =
        `
        translate(
            ${offsetX}px,
            ${offsetY}px
        )
        scale(${scale})
        `;

}


/* =========================================
   PROVINCE POLYGONY
========================================= */

function drawProvinces() {

    if (!map.naturalWidth)
        return;


    svg.innerHTML = "";


    provinces.forEach(
        function(province) {

            if (
                !province.points ||
                province.points.length < 3
            ) {

                return;

            }


            const polygon =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "polygon"
                );


            polygon.classList.add(
                "province"
            );


            polygon.setAttribute(
                "points",

                province.points
                    .map(
                        function(point) {

                            return (
                                point.x +
                                "," +
                                point.y
                            );

                        }
                    )
                    .join(" ")
            );


            polygon.setAttribute(
                "fill",

                province.color ||
                "#888888"
            );


            polygon.style.fillOpacity =
                0.5;


            polygon.addEventListener(
                "click",
                function(event) {

                    event.stopPropagation();


                    selectProvince(
                        province,
                        polygon
                    );

                }
            );


            svg.appendChild(
                polygon
            );

        }
    );

}


/* =========================================
   VÝBĚR PROVINCIE
========================================= */

function selectProvince(
    province,
    polygon
) {

    document
        .querySelectorAll(
            ".province.selected"
        )
        .forEach(
            function(element) {

                element.classList.remove(
                    "selected"
                );

            }
        );


    selectedProvince =
        province;


    polygon.classList.add(
        "selected"
    );


    showStatistics(
        province
    );

}


/* =========================================
   ZOBRAZENÍ STATISTIK
========================================= */

function showStatistics(
    province
) {

    const name =
        String(
            province.name
        );


    const stats =
        statistics[name];


    document.getElementById(
        "provinceName"
    ).textContent =

        province.display_name ||

        "Provincie " +
        name;


    if (!stats) {

        clearStatistics();

        return;

    }


    document.getElementById(
        "obili"
    ).textContent =
        stats.obili ?? 0;


    document.getElementById(
        "drevo"
    ).textContent =
        stats.drevo ?? 0;


    document.getElementById(
        "zelezo"
    ).textContent =
        stats.zelezo ?? 0;


    document.getElementById(
        "tkanina"
    ).textContent =
        stats.tkanina ?? 0;


    document.getElementById(
        "mesto"
    ).textContent =

        stats.mesto
            ? "Ano"
            : "Ne";


    document.getElementById(
        "terrain"
    ).textContent =

        stats.terrain ||
        "-";


    document.getElementById(
        "vlastnik"
    ).textContent =

        stats.vlastnik ||
        "-";


    /*
     * building_slots je JSONB
     */

    let buildings =
        stats.building_slots;


    if (
        typeof buildings === "string"
    ) {

        try {

            buildings =
                JSON.parse(
                    buildings
                );

        }
        catch {

            buildings = [];

        }

    }


    if (
        !Array.isArray(buildings)
    ) {

        buildings = [];

    }


    for (
        let i = 0;
        i < 5;
        i++
    ) {

        document.getElementById(
            "building" +
            (i + 1)
        ).textContent =

            buildings[i] ||
            "-";

    }

}


/* =========================================
   VYMAZÁNÍ STATISTIK
========================================= */

function clearStatistics() {

    const ids = [

        "obili",
        "drevo",
        "zelezo",
        "tkanina",
        "mesto",
        "terrain",
        "vlastnik",
        "building1",
        "building2",
        "building3",
        "building4",
        "building5"

    ];


    ids.forEach(
        function(id) {

            const element =
                document.getElementById(id);


            if (element) {

                element.textContent =
                    "-";

            }

        }
    );

}


/* =========================================
   KLIK MIMO
========================================= */

mapArea.addEventListener(
    "click",
    function(event) {

        if (
            event.target === mapArea ||
            event.target === map
        ) {

            selectedProvince =
                null;


            document
                .querySelectorAll(
                    ".province.selected"
                )
                .forEach(
                    function(element) {

                        element.classList.remove(
                            "selected"
                        );

                    }
                );


            document.getElementById(
                "provinceName"
            ).textContent =
                "Vyber provincii";


            clearStatistics();

        }

    }
);


/* =========================================
   ZOOM
========================================= */

mapArea.addEventListener(
    "wheel",
    function(event) {

        event.preventDefault();


        const mouseX =
            event.clientX;


        const mouseY =
            event.clientY;


        const mapX =
            (
                mouseX -
                offsetX
            ) / scale;


        const mapY =
            (
                mouseY -
                offsetY
            ) / scale;


        const factor =
            event.deltaY < 0
                ? 1.15
                : 1 / 1.15;


        const newScale =
            Math.max(
                0.1,
                Math.min(
                    10,
                    scale * factor
                )
            );


        offsetX =
            mouseX -
            mapX * newScale;


        offsetY =
            mouseY -
            mapY * newScale;


        scale =
            newScale;


        updateTransform();

    },
    {
        passive: false
    }
);


/* =========================================
   PAN
========================================= */

mapArea.addEventListener(
    "mousedown",
    function(event) {

        if (
            event.button !== 0
        )
            return;


        if (
            event.target.classList &&
            event.target.classList.contains(
                "province"
            )
        )
            return;


        dragging = true;


        dragStartX =
            event.clientX;


        dragStartY =
            event.clientY;


        startOffsetX =
            offsetX;


        startOffsetY =
            offsetY;


        mapArea.classList.add(
            "dragging"
        );

    }
);


window.addEventListener(
    "mousemove",
    function(event) {

        if (!dragging)
            return;


        offsetX =
            startOffsetX +
            event.clientX -
            dragStartX;


        offsetY =
            startOffsetY +
            event.clientY -
            dragStartY;


        updateTransform();

    }
);


window.addEventListener(
    "mouseup",
    function() {

        dragging = false;

        mapArea.classList.remove(
            "dragging"
        );

    }
);


/* =========================================
   RESIZE
========================================= */

window.addEventListener(
    "resize",
    function() {

        updateTransform();

    }
);


/* =========================================
   START
========================================= */

loadData();