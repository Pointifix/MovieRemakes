class Graph {
    #container;

    #data;
    #sorting;

    #numColors; #directorColors;

    constructor() {
        if (!!Graph.instance) return Graph.instance;
        Graph.instance = this;

        return this;
    }

    createGraph(data, sorting) {
        this.#data = data;
        this.#sorting = sorting;

        this.#preprocessData();

        d3.select("body")
            .append("svg")
            .attr("id", "GraphContainer")
            .attr("width", "2214")
            .attr("height", "2718")
            .style("background-color", Constants.COLORS.BACKGROUND);

        this.#container = d3.select("#GraphContainer");

        axes.createAxes(this.#container, this.#data, this.#sorting);
        covers.createCovers(this.#container, this.#data);

        this.#drawDirectorConnections();
        this.#drawMovieDots();
    }

    #drawMovieDots() {
        let data = this.#data;
        let directorColors = this.#directorColors;

        // transform function for the movie positions
        let transformFunction = function (item) {
            let it = item;
            while (it["original"] === false) {
                it = data["movies"][data["links"].filter(elem => elem["id_remake"]["id"] === it["id"])[0]["id_original"]["id"]];
            }

            return "translate(" + (axes.x(item["year"]) + axes.maxFilmTextLength) + "," + (axes.y(it["title"]) + axes.y.step() / 2) + ")";
        };

        // draw movie dots for their first director
        this.#container.append('g')
            .selectAll("dot")
            .data(data["movies"])
            .enter()
            .append("path")
            .attr("d", function (item) {
                    return d3.arc()({
                        innerRadius: 0,
                        outerRadius: axes.y.step() * 0.6,
                        startAngle: 0,
                        endAngle: Math.PI * 2
                    });
                }
            )
            .attr("transform", transformFunction)
            .style("fill", function (item) {
                return directorColors[item["directors"][0]];
            });

        // draw movie dots for their second director (if they have one)
        this.#container.append('g')
            .selectAll("dot")
            .data(data["movies"].filter(elem => elem["directors"].length === 2))
            .enter()
            .append("path")
            .attr("d", function (item) {
                    return d3.arc()({
                        innerRadius: 0,
                        outerRadius: axes.y.step() * 0.6,
                        startAngle: 0,
                        endAngle: Math.PI
                    });
                }
            )
            .attr("transform", transformFunction)
            .style("fill", function (item) {
                return directorColors[item["directors"][1]];
            });

        // draw movie covers inside the movie dots
        let i = 0;
        this.#container.append('g')
            .selectAll("dot")
            .data(data["movies"])
            .enter()
            .append("path")
            .attr("d", d3.arc()({
                    innerRadius: 0,
                    outerRadius: axes.y.step() * 0.5,
                    startAngle: 0,
                    endAngle: Math.PI * 2
                })
            )
            .attr("data", function(item) {
                return JSON.stringify(item);
            })
            .attr("transform", transformFunction)
            .style("fill", function() {
                return "url(#img" + ++i + ")";
            });

        // director labels
        let directorLabelsDrawn = new Array(directorColors.length);

        this.#container.selectAll("g.dot")
            .data(data["movies"])
            .enter()
            .append("text")
            .text(function(item) {
                if (directorColors[item["directors"][0]].s !== 0 && directorLabelsDrawn[item["directors"][0]]) return "";

                directorLabelsDrawn[item["directors"][0]] = true;

                return data["directors"][item["directors"][0]]["name"];
            })
            .attr("transform", transformFunction)
            .attr("x", -axes.y.step() * 0.8)
            .attr("y", "0.5em")
            .style("text-anchor", "end")
            .attr("font-size", Constants.FONT_SIZE)
            .attr("font-family", 'Verdana, sans-serif')
            .attr("font-weight", "bold")
            .attr("fill", "white");

        this.#container.selectAll("g.dot")
            .data(data["movies"].filter(elem => elem["directors"].length === 2))
            .enter()
            .append("text")
            .text(function(item) {
                if (directorColors[item["directors"][1]].s !== 0) return "";

                return data["directors"][item["directors"][1]]["name"];
            })
            .attr("transform", transformFunction)
            .attr("x", axes.y.step() * 0.8)
            .attr("y", "0.5em")
            .style("text-anchor", "end")
            .attr("font-size", Constants.FONT_SIZE)
            .attr("font-family", 'Verdana, sans-serif')
            .attr("font-weight", "bold")
            .attr("fill", "white");
    }

    #drawDirectorConnections() {
        let data = this.#data;
        let sorting = this.#sorting;
        let directorColors = this.#directorColors;

        let legend_index = 0;
        for (let i = 0; i < data["directors"].length; i++) {
            if (directorColors[i].s !== 0) {
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

                    movies[j]["sortingIndex"] = sorting.indexOf(originalFilm["title"]);
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

                this.#container.append("path")
                    .datum(movies)
                    .attr("fill", "none")
                    .attr("stroke", function (item) {
                        return directorColors[i];
                    })
                    .attr("stroke-linejoin", "bevel")
                    .attr("stroke-width", (axes.y.step() * 0.2) + "px")
                    .attr("d", d3.line()
                        .y(function (item) {
                            let it = item;
                            while (it["original"] === false) {
                                it = data["movies"][data["links"].filter(elem => elem["id_remake"]["id"] === it["id"])[0]["id_original"]["id"]];
                            }

                            return axes.y(it["title"]) + axes.y.step() * 0.5;
                        })
                        .x(function (item) {
                            return axes.x(item["year"]) + axes.maxFilmTextLength;
                        })
                    )

                legend_index++;
            }
        }
    }

    #preprocessData() {
        this.#calculateDirectorColors();
    }

    #calculateDirectorColors() {
        this.#directorColors = new Array(this.#data["directors"].length);
        this.#numColors = 0;

        for (let i = 0; i < this.#data["movies"].length; i++) {
            let movie = this.#data["movies"][i];

            for (let j = 0; j < movie["directors"]; j++) {
                let director = movie["directors"][j];

                if (this.#directorColors[director] === undefined) {
                    this.#directorColors[director] = false;
                } else if (this.#directorColors[director] === false) {
                    this.#directorColors[director] = true;
                    this.#numColors++;
                }
            }
        }

        let counter = 0;
        let step = 360.0 / this.#numColors;

        for (let i = 0; i < this.#directorColors.length; i++) {
            if (this.#directorColors[i]) {
                this.#directorColors[i] = d3.hsl(counter * step, 1, 0.5);
                counter++;
            } else {
                this.#directorColors[i] = d3.hsl(0, 0, 0.5);
            }
        }

        function swap(array, i1, i2) { let tmp = array[i1]; array[i1] = array[i2]; array[i2] = tmp; }

        swap(this.#directorColors, 29, 80);
        swap(this.#directorColors, 58, 33);
        swap(this.#directorColors, 73, 45);
        swap(this.#directorColors, 31, 70);
    }
}

const graph = new Graph();
