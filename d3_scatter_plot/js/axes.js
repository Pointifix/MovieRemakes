class Axes {
    #x; #y;
    #xAxis; #yAxis;

    #container;

    #maxFilmTextLength; #yearsTextSize;

    constructor() {
        if (!!Axes.instance) return Axes.instance;
        Axes.instance = this;

        return this;
    }

    createAxes(container, data, sorting) {
        this.#container = container.append("g")
            .attr("id", "axes")
            .attr("width", container.node().getAttribute("width"))
            .attr("height", container.node().getAttribute("height"));

        this.#createXAxis(data, sorting);
        this.#createYAxis(data, sorting);

        this.#transformAndStyleAxes();
    }

    #createXAxis(data, sorting) {
        let years = data["movies"].map(item => item["year"]);
        let minYear = Math.min(...years);
        let maxYear = Math.max(...years);

        this.#x = d3.scaleLinear()
            .domain([minYear - 5, maxYear + 5]);

        this.#xAxis = this.#container.append("g")
            .attr("id", "xAxis")
            .call(d3.axisBottom(this.#x));

        this.#yearsTextSize = this.#xAxis.selectAll("text").nodes()[0].getComputedTextLength();

        Axes.#setTextStyle(this.#container.select("#xAxis"));
    }

    #createYAxis(data, sorting) {
        this.#y = d3.scaleBand()
            .domain(sorting);

        this.#yAxis = this.#container.append("g")
            .attr("id", "yAxis")
            .call(d3.axisLeft(this.#y));

        Axes.#setTextStyle(this.#container.select("#yAxis"));

        this.#maxFilmTextLength = d3.max(this.#yAxis.selectAll("text").nodes(), n => n.getComputedTextLength()) + 2 * Constants.AXES.TICK_PADDING;
    }

    static #setTextStyle(container) {
        container
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("font-size", Constants.FONT_SIZE)
            .attr("font-family", 'Verdana, sans-serif')
            .attr("font-weight", "bold")
            .attr("fill", "white");
    }

    #transformAndStyleAxes(container) {
        d3.select("#xAxis")
            .attr("transform", "translate(" + this.#maxFilmTextLength + "," + (this.#container.node().getAttribute("height") - this.#yearsTextSize) + ")");
        this.#x.range([0, this.#container.node().getAttribute("width") - this.#maxFilmTextLength]);
        this.#xAxis.call(d3.axisBottom(this.#x)
            .tickSize(0)
            .tickPadding(Constants.AXES.TICK_PADDING * 2)
            .tickFormat(d3.format("d"))
        );

        d3.select("#yAxis")
            .attr("transform", "translate(" + this.#maxFilmTextLength + "," + 0 + ")");
        this.#y.range([0, this.#container.node().getAttribute("height") - this.#yearsTextSize]);
        this.#yAxis.call(d3.axisLeft(this.#y)
            .tickSize(0)
            .tickPadding(Constants.AXES.TICK_PADDING)
            .tickSize(-this.#container.node().getAttribute("width") + this.#maxFilmTextLength)
        );

        d3.selectAll("#axes line")
            .attr('stroke', d3.hsl(0, 0, 0.2));

        d3.selectAll("#axes path.domain").remove();
    }

    get x() { return this.#x; }
    get y() { return this.#y; }

    get maxFilmTextLength() { return this.#maxFilmTextLength; }
}

const axes = new Axes();
