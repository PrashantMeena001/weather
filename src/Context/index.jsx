import { useContext, createContext, useState, useEffect } from "react";
import axios from 'axios'

const StateContext = createContext()

// Map WMO weather codes to condition strings
const getConditionFromCode = (code) => {
    if (code === 0) return 'Clear'
    if (code === 1 || code === 2 || code === 3) return 'Cloudy'
    if (code === 45 || code === 48) return 'Fog'
    if (code >= 51 && code <= 67) return 'Rain'
    if (code >= 71 && code <= 77) return 'Snow'
    if (code >= 80 && code <= 82) return 'Rain Shower'
    if (code >= 85 && code <= 86) return 'Snow Shower'
    if (code >= 95 && code <= 99) return 'Thunderstorm'
    return 'Clear'
}

export const StateContextProvider = ({ children }) => {
    const [weather, setWeather] = useState({})
    const [values, setValues] = useState([])
    const [place, setPlace] = useState('Jaipur')
    const [thisLocation, setLocation] = useState('')

    // fetch weather using free Open-Meteo API (no API key needed)
    const fetchWeather = async () => {
        try {
            // Step 1: Geocode the city name to lat/lon
            const geoResponse = await axios.get(
                `https://geocoding-api.open-meteo.com/v1/search`,
                { params: { name: place, count: 1, language: 'en', format: 'json' } }
            )

            if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
                alert('This place does not exist')
                return
            }

            const { latitude, longitude, name } = geoResponse.data.results[0]
            setLocation(name)

            // Step 2: Fetch weather data
            const weatherResponse = await axios.get(
                `https://api.open-meteo.com/v1/forecast`,
                {
                    params: {
                        latitude,
                        longitude,
                        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
                        daily: 'temperature_2m_max,temperature_2m_min,weather_code',
                        timezone: 'auto',
                        forecast_days: 7
                    }
                }
            )

            const data = weatherResponse.data
            console.log(data)

            // Map current weather to expected format
            const currentWeather = {
                temp: data.current.temperature_2m,
                wspd: data.current.wind_speed_10m,
                humidity: data.current.relative_humidity_2m,
                heatindex: data.current.apparent_temperature,
                conditions: getConditionFromCode(data.current.weather_code),
                datetime: new Date().toISOString(),
            }
            setWeather(currentWeather)

            // Map daily forecast to expected format
            const dailyValues = data.daily.time.map((date, i) => ({
                datetime: date,
                temp: Math.round((data.daily.temperature_2m_max[i] + data.daily.temperature_2m_min[i]) / 2),
                conditions: getConditionFromCode(data.daily.weather_code[i]),
            }))
            setValues(dailyValues)

        } catch (e) {
            console.error(e);
            alert('Failed to fetch weather data. Please try again.')
        }
    }

    useEffect(() => {
        fetchWeather()
    }, [place])

    useEffect(() => {
        console.log(values)
    }, [values])

    return (
        <StateContext.Provider value={{
            weather,
            setPlace,
            values,
            thisLocation,
            place
        }}>
            {children}
        </StateContext.Provider>
    )
}

export const useStateContext = () => useContext(StateContext)