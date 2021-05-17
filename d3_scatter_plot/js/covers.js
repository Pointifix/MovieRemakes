class Covers {
    constructor() {
        if (!!Covers.instance) return Covers.instance;
        Covers.instance = this;

        return this;
    }

    createCovers(container, data) {
        let i = 0;
        container.append("defs")
            .selectAll("use")
            .data(data["movies"])
            .enter()
            .append("pattern")
            .attr("id", function(item) {
                i++;
                return "img" + i;
            })
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", axes.y.step())
            .attr("height", axes.y.step())
            .attr("x", axes.y.step() / 2.0)
            .attr("y", axes.y.step() / 2.0)
            .append("image")
            .attr("href", function(item) {
                return "data/film_covers/" + item["title"].replace(" ", "_").replace("?", "") + "_" + item["year"] + ".jpg";
            })
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", axes.y.step())
            .attr("height", axes.y.step())
    }
}

const covers = new Covers();
