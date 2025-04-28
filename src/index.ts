import express, { Request, Response } from "express";
import axios from "axios";
import { z } from "zod";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Existing schemas
const WeatherResponseSchema = z.object({
    name: z.string(),
    main: z.object({
        temp: z.number(),
        humidity: z.number(),
    }),
    weather: z.array(
        z.object({
            description: z.string(),
        })
    ),
});

const ForecastResponseSchema = z.object({
    list: z.array(
        z.object({
            dt_txt: z.string(),
            main: z.object({
                temp: z.number(),
            }),
            weather: z.array(
                z.object({
                    description: z.string(),
                })
            ),
        })
    ),
});

// New endpoint: /fetch_generic_documentation
app.get("/fetch_weather_documentation", async (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
        // Option 1: Fetch README.md from GitHub
        const readmeUrl = "https://raw.githubusercontent.com/mohitsingla46/weather/master/README.md";
        const response = await axios.get(readmeUrl);
        const readmeContent = response.data;

        // Stream the README content
        res.write(`data: ${JSON.stringify({ documentation: readmeContent })}\n\n`);
    } catch (error) {
        console.error("Error fetching documentation:", error);
        res.write(`data: ${JSON.stringify({ error: "Failed to fetch documentation" })}\n\n`);
    }

    res.end();
});

// Existing endpoints
app.get("/get-weather", async (req: Request, res: Response) => {
    const city = req.query.city as string;
    if (!city) {
        res.status(400).send("City is required");
        return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
        const apiKey = process.env.OPENWEATHER_API_KEY;
        const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
        const response = await axios.get(url);
        const validatedData = WeatherResponseSchema.parse(response.data);

        res.write(
            `data: ${JSON.stringify({
                city: validatedData.name,
                temperature: validatedData.main.temp,
                humidity: validatedData.main.humidity,
                description: validatedData.weather[0].description,
            })}\n\n`
        );
    } catch (error) {
        console.error("Error fetching weather:", error);
        res.write(`data: ${JSON.stringify({ error: "Failed to fetch weather data" })}\n\n`);
    }

    res.end();
});

app.get("/get-forecast", async (req: Request, res: Response) => {
    const city = req.query.city as string;
    if (!city) {
        res.status(400).send("City is required");
        return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
        const apiKey = process.env.OPENWEATHER_API_KEY;
        const url = `http://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
        const response = await axios.get(url);
        const validatedData = ForecastResponseSchema.parse(response.data);

        const forecasts = validatedData.list.slice(0, 5).map((item) => ({
            date: item.dt_txt,
            temperature: item.main.temp,
            description: item.weather[0].description,
        }));

        res.write(`data: ${JSON.stringify({ forecasts })}\n\n`);
    } catch (error) {
        console.error("Error fetching forecast:", error);
        res.write(`data: ${JSON.stringify({ error: "Failed to fetch forecast data" })}\n\n`);
    }

    res.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});