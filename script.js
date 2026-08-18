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

const panel =
    document.getElementById("panel");

const closePanel =
    document.getElementById("closePanel");

const terrainImage =
    document.getElementById("terrainImage");


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
   NAČTENÍ DAT
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

    catch (error) {

        console.error(
            "Chyba při načítání dat:",
            error
        );


        status.textContent =
            "Chyba při načítání databáze";

    }

}


/* =========================================
   NAČTENÍ MAPY
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
   VYSTŘEDĚNÍ MAPY
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
   TRANSFORMACE
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
   VYKRESLENÍ PROVINCIÍ
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


    panel.classList.add(
        "open"
    );

}


/* =========================================
   OBRÁZEK TERÉNU
========================================= */

function updateTerrainImage(
    terrain
) {

    const terrainName =
        String(
            terrain || ""
        )
        .toLowerCase()
        .trim();


    let imageURL = "";


    /*
     * HORY
     */

    if (
        terrainName === "hory" ||
        terrainName === "hora" ||
        terrainName === "mountains"
    ) {

        imageURL =
            "https://vic3.paradoxwikis.com/images/9/9d/State_picture_mountains.png";

    }


    /*
     * ROVINA
     */

    else if (
        terrainName === "rovina" ||
        terrainName === "roviny" ||
        terrainName === "plane" ||
        terrainName === "plains"
    ) {

        imageURL =
            "https://vic3.paradoxwikis.com/images/0/0a/State_picture_plains.png";

    }


    /*
     * LES
     */

    else if (
        terrainName === "les" ||
        terrainName === "lesy" ||
        terrainName === "forest" ||
        terrainName === "forests"
    ) {

        imageURL =
            "https://vic3.paradoxwikis.com/images/1/1f/State_picture_forest.png";

    }


    /*
     * BAŽINA
     */

    else if (
        terrainName === "bazina" ||
        terrainName === "baziny" ||
        terrainName === "bažina" ||
        terrainName === "bažiny" ||
        terrainName === "wetland" ||
        terrainName === "wetlands"
    ) {

        imageURL =
            "https://vic3.paradoxwikis.com/images/5/50/State_picture_wetland.png";

    }


    /*
     * ZOBRAZENÍ
     */

    if (imageURL) {

        terrainImage.src =
            imageURL;

        terrainImage.style.display =
            "block";

    }

    else {

        terrainImage.src = "";

        terrainImage.style.display =
            "none";

    }

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


    /*
     * Pokud statistiky neexistují
     */

    if (!stats) {

        clearStatistics();

        updateTerrainImage("");

        return;

    }


    /* TERÉN */

    updateTerrainImage(
        stats.terrain
    );


    /* PRODUKCE */

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


    /* MĚSTO */

    document.getElementById(
        "mesto"
    ).textContent =

        stats.mesto
            ? "Ano"
            : "Ne";


    /* TERÉN */

    document.getElementById(
        "terrain"
    ).textContent =

        stats.terrain ||
        "-";


    /* VLASTNÍK */

    document.getElementById(
        "vlastnik"
    ).textContent =

        stats.vlastnik ||
        "-";


    /* =====================================
       BUILDING SLOTS
    ===================================== */

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
   KLIK MIMO PROVINCIE
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


            updateTerrainImage("");


            panel.classList.remove(
                "open"
            );

        }

    }
);


/* =========================================
   ZAVŘENÍ PANELU
========================================= */

closePanel.addEventListener(
    "click",
    function(event) {

        event.stopPropagation();


        panel.classList.remove(
            "open"
        );

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