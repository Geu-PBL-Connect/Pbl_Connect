import axios from "axios";

export const openPrivateFile = async (submissionId) => {
  try {
    const token = JSON.parse(localStorage.getItem("userInfo"))?.token;

    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/files/view/${submissionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    window.open(res.data.url, "_blank");
  } catch (err) {
    console.error(err);
    alert("Unable to open file.");
  }
};
