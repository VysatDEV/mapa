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

let owners = {};

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

const ownerFlag =
    document.getElementById("ownerFlag");


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

        throw error;

    }


    provinces = data || [];

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

}


/* =========================================
   NAČTENÍ VLASTNÍKŮ
========================================= */

async function loadOwners() {

    try {

        const response =
            await fetch("owners.json");


        if (!response.ok) {

            throw new Error(
                "Nepodařilo se načíst owners.json"
            );

        }


        const data =
            await response.json();


        owners = {};


        data.forEach(
            function(owner) {

                owners[
                    String(owner.name)
                ] = owner;

            }
        );


    }

    catch (error) {

        console.error(
            "Chyba při načítání owners.json:",
            error
        );

    }

}


/* =========================================
   NAČTENÍ VŠECH DAT
========================================= */

async function loadData() {

    try {

        status.textContent =
            "Načítám data...";


        await loadProvinces();

        await loadStatistics();

        await loadOwners();


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
            "Chyba při načítání dat";

    }

}


/* =========================================
   MAPA NAČTENA
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
   TRANSFORMACE MAPY
========================================= */

function updateTransform() {

    mapContainer.style.transform =
        `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;

}


/* =========================================
   STŘED PROVINCIE
========================================= */

function getProvinceCenter(points) {

    let x = 0;

    let y = 0;


    points.forEach(
        function(point) {

            x += Number(point.x);

            y += Number(point.y);

        }
    );


    return {

        x: x / points.length,

        y: y / points.length

    };

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


            /* STATISTIKY PROVINCIE */

            const provinceStats =
                statistics[
                    String(province.name)
                ];


            /* VLASTNÍK */

            const ownerName =
                provinceStats?.vlastnik;


            const owner =
                owners[
                    String(ownerName || "")
                ];


            /* BARVA PROVINCIE */

            polygon.setAttribute(
                "fill",

                owner?.color ||

                province.color ||

                "#888888"
            );


            polygon.style.fillOpacity =
                0.55;


            /* KLIK */

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


            /* =================================
               IKONA MĚSTA
            ================================= */

            if (
                provinceStats?.mesto === true
            ) {

                const center =
                    getProvinceCenter(
                        province.points
                    );


                const cityIcon =
                    document.createElementNS(
                        "http://www.w3.org/2000/svg",
                        "image"
                    );


                cityIcon.setAttribute(
                    "href",
                    "city.png"
                );


                cityIcon.setAttribute(
                    "x",
                    center.x - 15
                );


                cityIcon.setAttribute(
                    "y",
                    center.y - 15
                );


                cityIcon.setAttribute(
                    "width",
                    30
                );


                cityIcon.setAttribute(
                    "height",
                    30
                );


                cityIcon.classList.add(
                    "city-icon"
                );


                cityIcon.style.pointerEvents =
                    "none";


                svg.appendChild(
                    cityIcon
                );

            }

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


    /* VYBRANÁ PROVINCIE NA VRCH */

    svg.appendChild(
        polygon
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

function updateTerrainImage(terrain) {

    const terrainName =
        String(
            terrain || ""
        )
        .toLowerCase()
        .trim();


    let imageURL = "";


    if (
        terrainName === "hory" ||
        terrainName === "hora" ||
        terrainName === "mountains"
    ) {

        imageURL =
            "https://vic3.paradoxwikis.com/images/9/9d/State_picture_mountains.png";

    }


    else if (
        terrainName === "rovina" ||
        terrainName === "roviny" ||
        terrainName === "plane" ||
        terrainName === "plains"
    ) {

        imageURL =
            "https://vic3.paradoxwikis.com/images/0/0a/State_picture_plains.png";

    }


    else if (
        terrainName === "les" ||
        terrainName === "lesy" ||
        terrainName === "forest"
    ) {

        imageURL =
            "https://vic3.paradoxwikis.com/images/1/1f/State_picture_forest.png";

    }


    else if (
        terrainName === "bazina" ||
        terrainName === "baziny" ||
        terrainName === "bažina" ||
        terrainName === "bažiny" ||
        terrainName === "wetland"
    ) {

        imageURL =
            "https://vic3.paradoxwikis.com/images/5/50/State_picture_wetland.png";

    }


    if (imageURL) {

        terrainImage.src =
            imageURL;

        terrainImage.style.display =
            "block";

    }

    else {

        terrainImage.src =
            "";

        terrainImage.style.display =
            "none";

    }

}


/* =========================================
   ZOBRAZENÍ STATISTIK
========================================= */

function showStatistics(province) {

    const name =
        String(province.name);


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

        updateTerrainImage("");

        ownerFlag.src = "";

        ownerFlag.style.display =
            "none";

        return;

    }


    /* TERÉN */

    updateTerrainImage(
        stats.terrain
    );


    /* VLAJKA */

    const owner =
        owners[
            String(
                stats.vlastnik || ""
            )
        ];


    if (
        owner &&
        owner.flag
    ) {

        ownerFlag.src =
            owner.flag;

        ownerFlag.style.display =
            "block";

    }

    else {

        ownerFlag.src =
            "";

        ownerFlag.style.display =
            "none";

    }


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
        stats.terrain || "-";


    /* VLASTNÍK */

    document.getElementById(
        "vlastnik"
    ).textContent =
        stats.vlastnik || "-";


    /* BUDOVY */

    let buildings =
        stats.building_slots;


    if (
        typeof buildings === "string"
    ) {

        try {

            buildings =
                JSON.parse(buildings);

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
   KLIK MIMO MAPU
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


            panel.classList.remove(
                "open"
            );

        }

    }
);


/* =========================================
   ZAVŘÍT PANEL
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
   POSOUVÁNÍ MAPY
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


        dragging =
            true;


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

        dragging =
            false;


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