function init() {
    let margin = {top: 20, right: 20, bottom: 20, left: 20},
        width = window.innerWidth - margin.left - margin.right,
        height = window.innerHeight - margin.top - margin.bottom;

    let svg = d3.select("#svg_container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("background-color", d3.hsl(0, 0, 0.1))
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let legend = d3.select("#legend_container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("background-color", d3.hsl(0, 0, 0.1))
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.json("goodSolutions.json", function (data) {
        let sorting = data[3]["solution"];

        d3.json("data.json", function (data) {
            console.log(data);

            //sorting = optimizeDirectorSorting(data, sorting);

            console.log(sorting);

            let [x, y, marginText] = initAxis(margin, width, height, svg, data, sorting);

            let movies_output = []
            for (let i = 0; i < data["movies"].length; i++) {
                let movie = data["movies"][i];
                movies_output += i + " " + movie["title"].replace(" ", "_").replace("?", "") + "_" + movie["year"] + "\n";
            }
            console.log(movies_output);

            let i = 0;
            svg.append("defs")
                .selectAll("use")
                .data(data["movies"])
                .enter()
                .append("pattern")
                .attr("id", function(item) {
                    i++;
                    return "img" + i;
                })
                .attr("patternUnits", "userSpaceOnUse")
                .attr("width", x.step())
                .attr("height", x.step())
                .attr("x", x.step() / 2.0)
                .attr("y", x.step() / 2.0)
                .append("image")
                .attr("href", function(item) {
                    return "film_covers/" + item["title"].replace(" ", "_").replace("?", "") + "_" + item["year"] + ".jpg";
                })
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", x.step())
                .attr("height", x.step())

            let directorColors = new Array(data["directors"].length);
            let amountColors = 0;

            for (let i = 0; i < data["movies"].length; i++) {
                let movie = data["movies"][i];

                for (let j = 0; j < movie["directors"]; j++) {
                    let director = movie["directors"][j];

                    if (directorColors[director] === undefined) {
                        directorColors[director] = false;
                    } else if (directorColors[director] === false) {
                        directorColors[director] = true;
                        amountColors++;
                    }
                }
            }

            let counter = 0;
            let step = 360.0 / amountColors;

            for (let i = 0; i < directorColors.length; i++) {
                if (directorColors[i]) {
                    directorColors[i] = d3.hsl(counter * step, 1, 0.5);
                    counter++;
                } else {
                    directorColors[i] = d3.hsl(0, 0, 0.5);
                }
            }

            function swap(array, i1, i2) {
                console.log("swap");

                let tmp = array[i1];
                array[i1] = array[i2];
                array[i2] = tmp;
            }

            // colors swaps for solution 0
            swap(directorColors, 29, 80);
            swap(directorColors, 58, 33);
            swap(directorColors, 73, 45);
            swap(directorColors, 31, 70);

            const offset = x.step() / 2;

            // director color lines
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

                    console.log(movies);

                    legend.append("circle")
                        .attr("cx", 0)
                        .attr("cy", legend_index * 25)
                        .attr("r", 10)
                        .style("fill", directorColors[i])

                    legend.append("text")
                        .attr("x", 30)
                        .attr("y", legend_index * 25)
                        .text(data["directors"][i]["name"])
                        .attr("font-family", 'Verdana, sans-serif')
                        .attr("font-size", "x-small")
                        .attr("fill", "white");

                    svg.append("path")
                        .datum(movies)
                        .attr("fill", "none")
                        .attr("stroke", function (item) {
                            return directorColors[i];
                        })
                        .attr("stroke-linejoin", "bevel")
                        .attr("stroke-width", (x.step() / 2.5) + "px")
                        .attr("d", d3.line()
                            .x(function (item) {
                                if (item["original"]) return x(item["title"]) + marginText.left + offset;

                                let currentItem = item, currentLink;
                                do {
                                    currentLink = data["links"].filter(elem => elem["id_remake"]["id"] === currentItem["id"]);

                                    currentItem = data["movies"][currentLink[0]["id_original"]["id"]];
                                } while (currentItem["original"] === false)

                                return x(currentItem["title"]) + marginText.left + offset;
                            })
                            .y(function (item) {
                                return y(item["year"])
                            })
                        )

                    legend_index++;
                }
            }

            let arc = d3.arc();

            let transformFunction = function (item) {
                if (item["original"]) return "translate(" + (x(item["title"]) + marginText.left + offset) + "," + y(item["year"]) + ")";

                let currentItem = item, currentLink;
                do {
                    currentLink = data["links"].filter(elem => elem["id_remake"]["id"] === currentItem["id"]);

                    currentItem = data["movies"][currentLink[0]["id_original"]["id"]];
                } while (currentItem["original"] === false)

                return "translate(" + (x(currentItem["title"]) + marginText.left + offset) + "," + y(item["year"]) + ")";
            };

            svg.append('g')
                .selectAll("dot")
                .data(data["movies"])
                .enter()
                .append("path")
                .attr("d", function (item) {
                        return arc({
                            innerRadius: 0,
                            outerRadius: x.step() / 1.5,
                            startAngle: item["directors"].length === 2 ? Math.PI : 0,
                            endAngle: Math.PI * 2
                        });
                    }
                )
                .attr("transform", transformFunction)
                .style("fill", function (item) {
                    let color = directorColors[item["directors"][0]];

                    return color;
                });

            svg.append('g')
                .selectAll("dot")
                .data(data["movies"].filter(elem => elem["directors"].length === 2))
                .enter()
                .append("path")
                .attr("d", function (item) {
                        return arc({
                            innerRadius: 0,
                            outerRadius: x.step() / 1.5,
                            startAngle: 0,
                            endAngle: Math.PI
                        });
                    }
                )
                .attr("transform", transformFunction)
                .style("fill", function (item) {
                    let color = directorColors[item["directors"][1]];

                    return color;
                });

            i = 0;
            svg.append('g')
                .selectAll("dot")
                .data(data["movies"])
                .enter()
                .append("path")
                .attr("d", arc({
                        innerRadius: 0,
                        outerRadius: x.step() / 2.0,
                        startAngle: 0,
                        endAngle: Math.PI * 2
                    })
                )
                .attr("data", function(item) {
                    return JSON.stringify(item);
                })
                .attr("transform", transformFunction)
                .style("fill", function(item) {
                    i++;
                    return "url(#img" + i + ")";
                });

            svg.selectAll("g.dot")
                .data(data["movies"])
                .enter()
                .append("text")
                .text(function(item) {
                    if (directorColors[item["directors"][0]].s !== 0) return "";

                    return data["directors"][item["directors"][0]]["name"];
                })
                .attr("transform", transformFunction)
                .attr("x", 20)
                .attr("font-family", 'Verdana, sans-serif')
                .attr("font-size", "x-small")
                .attr("fill", "white");

            svg.selectAll("g.dot")
                .data(data["movies"].filter(elem => elem["directors"].length === 2))
                .enter()
                .append("text")
                .text(function(item) {
                    if (directorColors[item["directors"][1]].s !== 0) return "";

                    return data["directors"][item["directors"][1]]["name"];
                })
                .attr("transform", transformFunction)
                .attr("x", 20)
                .attr("font-family", 'Verdana, sans-serif')
                .attr("font-size", "x-small")
                .attr("fill", "white");
        })
    })
}