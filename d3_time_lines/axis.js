function initAxis(margin, width, height, svg, data, sorting) {
    let x = d3.scaleBand()
        .range([0, width])
        .domain(sorting);

    let originalFilmsAxis = svg.append("g");

    originalFilmsAxis.call(d3.axisBottom(x))
        .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", "-.6em")
            .attr("font-size", "larger")
            .attr("font-family", 'Verdana, sans-serif')
            .attr("font-weight", "bold")
            .attr("fill", "white")
            .attr("transform", "translate(2, 0), rotate(-90)");

    let maxOriginalFilmTextLength = d3.max(originalFilmsAxis.selectAll("text").nodes(), n => n.getComputedTextLength());

    let years = data["movies"].map(item => item["year"]);
    let minYear = Math.min(...years);
    let maxYear = Math.max(...years);

    let y = d3.scaleLinear()
        .domain([maxYear + 5, minYear - 5])
        .range([0, height - maxOriginalFilmTextLength])

    let yearsAxis = svg.append("g");

    yearsAxis.call(d3.axisLeft(y).tickFormat(d3.format("d")))
    yearsAxis.selectAll("text")
        .attr("font-family", 'Verdana, sans-serif')
        .attr("font-weight", "bold")
        .attr("fill", "white");

    let maxYearTextLength = d3.max(yearsAxis.selectAll("text").nodes(), n => n.getComputedTextLength());

    yearsAxis.attr("transform", "translate(" + (maxYearTextLength) + ", 0)");
    originalFilmsAxis.attr("transform", "translate(" + maxYearTextLength + "," + (height - maxOriginalFilmTextLength) + ")");

    x.range([0, width - maxYearTextLength]);
    originalFilmsAxis.call(d3.axisBottom(x));

    d3.selectAll("g.tick").selectAll("line").remove();

    function make_x_gridlines() {
        return d3.axisBottom(x)
            .ticks(5)
    }

    let ticks = svg.append("g")
        .attr("class", "grid")
        .attr("transform", "translate(" + maxYearTextLength + "," + (height - maxOriginalFilmTextLength) + ")")
        .call(make_x_gridlines()
            .tickSize(-height + maxOriginalFilmTextLength)
            .tickFormat("")
        )

    let i = 0;
    d3.selectAll("g.tick")
        .style('stroke-width', "1 px")
        .selectAll("line")
            .attr('stroke', function() {
                i++;
                return d3.hsl(0, 0, 0.2);
            })

    d3.selectAll("path.domain").remove();

    return [x,y,{left: maxYearTextLength, bottom: maxOriginalFilmTextLength}];
}