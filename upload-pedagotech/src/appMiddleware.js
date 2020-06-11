import Axios from "axios";

export const getToken = async () => {
    const res = await Axios.get(`http://localhost:5000/`, {
        headers: {
            "Content-Type": "application/json"
        }
    })
    return res.data.body;
}