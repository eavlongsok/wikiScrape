import cheerio from "cheerio"
import axios from "axios"
import cors from "cors"
import express from "express"
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = 5500

const app = express()

app.use(cors())

app.listen(PORT, () => {
    console.log("listening to port", PORT)
})


app.get('/', (req, res) => {
    const searchQuery = req.query.search;

    if (searchQuery) {
        let wiki = []
        const query = encodeURIComponent(req.query.search).replaceAll("%20", "+")
        axios("https://en.wikipedia.org/w/index.php?go=Go&search=" + query + "&ns0=1"
        ).then(response => {
            const htmlData = response.data
            const $ = cheerio.load(htmlData)
            $(".mw-search-results > li").each((index, element) => {
                let title = $(element).find("a").attr("title")
                let link = $(element).find("a").attr("href")
                let description = $(element).find(".searchresult").text()
                link = "https://en.wikipedia.org" + link
                wiki.push({
                    "title": title,
                    "link": link,
                    "description": description
                })
            })
            if (!wiki.length) {
                let title = $(".mw-page-title-main").text()
                let link = $("[rel='canonical']").attr("href")
                let firstParagraph = $("#mw-content-text > div:nth-child(1) > p:nth-child(11)").text()
                wiki.push({
                    "title": title,
                    "link": link,
                    "firstParagraph": firstParagraph
                })
                if (!title) res.status(400).send({
                    status: 400,
                    message: 'Search not found'
                 });
                else res.status(200).json(wiki)
            }
            else res.status(200).json(wiki)
        }).catch(err => {
            console.log(err)
        })
    } else {
        res.sendFile(path.join(__dirname, '/index.html'));
    }
});

