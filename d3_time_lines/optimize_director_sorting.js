function optimizeDirectorSorting(data, sorting = undefined) {
    if (sorting === undefined) {
        let originalFilms = data["movies"].filter(item => item["original"] === true);

        let originalFilmsMapping = originalFilms.map(function (item) {
            return item["title"];
        });

        sorting = d3.shuffle(originalFilmsMapping);
    }

    let iterations = 1;
    let bestCost = Infinity;
    let bestSorting = sorting;
    for (let i = 0; i < iterations; i++) {
        let a = Math.floor(Math.random() * (sorting.length - 1));

        let tmp = sorting[a];
        sorting[a] = sorting[a + 1];
        sorting[a + 1] = tmp;

        let cost = calculateCostCentroid(data, sorting);

        if (cost < bestCost) {
            bestCost = cost;
            bestSorting = [...sorting];
            sorting = [...bestSorting];
        } else if ((Math.exp(((bestCost - cost) * 100) / (iterations - i)) / 20.0) > Math.random()) {
            bestSorting = [...sorting];
            bestCost = cost;
            sorting = [...bestSorting];
        } else {
            sorting = [...bestSorting];
        }
    }
    console.log(bestCost, bestSorting);

    return bestSorting;
}

function calculateCostCentroid(data, sorting) {
    let groups = Array(data["directors"].length);

    // calculate centroids
    for (let i = 0; i < data["movies"].length; i++) {
        let movie = data["movies"][i];

        let originalFilm = movie;

        while (originalFilm["original"] === false) {
            let link = data["links"].filter(elem => elem["id_remake"]["id"] === originalFilm["id"]);
            originalFilm = data["movies"][link[0]["id_original"]["id"]];
        }

        for (let j = 0; j < movie["directors"].length; j++) {
            let director = movie["directors"][j];

            let x = sorting.indexOf(originalFilm["title"]) * 2;
            let y = originalFilm["year"];

            if (groups[director] === undefined) {
                groups[director] = {};
                groups[director]["centroid"] = [x, y];
                groups[director]["count"] = 1;
                groups[director]["cost"] = 0;
            } else {
                groups[director]["centroid"][0] += x;
                groups[director]["centroid"][1] += y;
                groups[director]["count"] += 1;
            }
        }
    }

    for (let i = 0; i < groups.length; i++) {
        groups[i]["centroid"][0] /= groups[i]["count"];
        groups[i]["centroid"][1] /= groups[i]["count"];
    }

    //calculate distances to centroids/ costs
    let totalCost = 0;

    for (let i = 0; i < data["movies"].length; i++) {
        let movie = data["movies"][i];

        let originalFilm = movie;

        while (originalFilm["original"] === false) {
            let link = data["links"].filter(elem => elem["id_remake"]["id"] === originalFilm["id"]);
            originalFilm = data["movies"][link[0]["id_original"]["id"]];
        }

        for (let j = 0; j < movie["directors"].length; j++) {
            let director = movie["directors"][j];

            let x = sorting.indexOf(originalFilm["title"]) * 2;
            let y = originalFilm["year"];

            let centroid = groups[director]["centroid"];

            let length = Math.pow(x - centroid[0], 2) + Math.pow(y - centroid[1], 2)

            groups[director]["cost"] += length;
            totalCost += length;
        }
    }

    return totalCost;
}

function calculateCostLineIntersections(data, sorting) {
    let groups = Array(data["directors"].length);

    let totalCost = 0;

    let lines = [];

    for (let i = 0; i < groups.length; i++) {
        let movies = [];

        for (let j = 0; j < data["movies"].length; j++) {
            if (data["movies"][j]["directors"].includes(i)) movies.push(data["movies"][j]);
        }

        for (let j = 0; j < movies.length; j++) {
            let originalFilm = movies[j];

            while (originalFilm["original"] === false) {
                let link = data["links"].filter(elem => elem["id_remake"]["id"] === originalFilm["id"]);
                originalFilm = data["movies"][link[0]["id_original"]["id"]];
            }

            let index = sorting.indexOf(originalFilm["title"]);

            movies[j]["sortingIndex"] = index;
        }

        function compare(a, b) {
            if (a["sortingIndex"] < b["sortingIndex"]) {
                return -1;
            }
            if (a["sortingIndex"] > b["sortingIndex"]) {
                return 1;
            }
            return 0;
        }

        movies.sort(compare);

        lines.push([]);
        for (let j = 0; j < movies.length - 1; j++) {
            let a = movies[j], b = movies[j + 1];

            lines[lines.length - 1].push({x1: a["sortingIndex"], y1: a["year"], x2: b["sortingIndex"], y2: b["year"]});
        }
    }

    function intersects(a,b,c,d,p,q,r,s) {
        let det, gamma, lambda;
        det = (c - a) * (s - q) - (r - p) * (d - b);
        if (det === 0) {
            return false;
        } else {
            lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
            gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
            return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
        }
    }

    for (let i = 0; i < lines.length; i++) {
        for (let j = 0; j < lines[i].length; j++) {
            for (let k = i + 1; k < lines.length; k++) {
                for (let l = 0; l < lines[k].length; l++) {
                    let l1 = lines[i][j];
                    let l2 = lines[k][l];

                    if (intersects(l1.x1, l1.y1, l1.x2, l1.y2, l2.x1, l2.y1, l2.x2, l2.y2)) {
                        totalCost += 10000;
                    }
                }
            }
        }
    }

    return totalCost;
}

function calculateCostNearestNeighbour(data, sorting) {
    let groups = Array(data["directors"].length);

    let totalCost = 0;

    let lines = [];

    for (let i = 0; i < groups.length; i++) {
        let movies = [];

        for (let j = 0; j < data["movies"].length; j++) {
            if (data["movies"][j]["directors"].includes(i)) movies.push(data["movies"][j]);
        }

        for (let j = 0; j < movies.length; j++) {
            let originalFilm = movies[j];

            while (originalFilm["original"] === false) {
                let link = data["links"].filter(elem => elem["id_remake"]["id"] === originalFilm["id"]);
                originalFilm = data["movies"][link[0]["id_original"]["id"]];
            }

            let index = sorting.indexOf(originalFilm["title"]);

            movies[j]["sortingIndex"] = index;
        }

        function compare(a, b) {
            if (a["sortingIndex"] < b["sortingIndex"]) {
                return -1;
            }
            if (a["sortingIndex"] > b["sortingIndex"]) {
                return 1;
            }
            return 0;
        }

        movies.sort(compare);

        for (let j = 0; j < movies.length - 1; j++) {
            let a = movies[j];
            let b = movies[j + 1];

            totalCost += Math.pow((b["sortingIndex"] * 2 - a["sortingIndex"] * 2), 2) + Math.pow((b["year"] - a["year"]), 2);
        }
    }

    return totalCost;
}

function calculateCostBoundingBox(data, sorting) {
    let groups = Array(data["directors"].length);

    for (let i = 0; i < data["movies"].length; i++) {
        let movie = data["movies"][i];

        let originalFilm = movie;

        while (originalFilm["original"] === false) {
            let link = data["links"].filter(elem => elem["id_remake"]["id"] === originalFilm["id"]);
            originalFilm = data["movies"][link[0]["id_original"]["id"]];
        }

        for (let j = 0; j < movie["directors"].length; j++) {
            let director = movie["directors"][j];

            let x = sorting.indexOf(originalFilm["title"]) * 2;

            if (groups[director] === undefined) {
                groups[director] = {};
                groups[director]["min"] = x;
                groups[director]["max"] = x;
            } else {
                if (x < groups[director]["min"]) groups[director]["min"] = x;
                if (x > groups[director]["max"]) groups[director]["max"] = x;
            }
        }
    }

    let totalCost = 0;

    for (let i = 0; i < groups.length; i++) {
        totalCost += (groups[i]["max"] - groups[i]["min"]);
    }

    return totalCost;
}