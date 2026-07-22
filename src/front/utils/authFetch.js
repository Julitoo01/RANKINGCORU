export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type");

  let data = null;

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();

    throw new Error(
      `El servidor no devolvió JSON. URL llamada: ${url}. Status: ${
        response.status
      }. Respuesta: ${text.slice(0, 120)}`
    );
  }

  if (!response.ok) {
    const tokenExpired =
      response.status === 401 ||
      data?.msg === "Token has expired" ||
      data?.msg === "Missing Authorization Header" ||
      data?.msg === "Invalid token";

    if (tokenExpired) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("profile");

      window.location.href = "/#/login";
      return null;
    }

    throw new Error(data?.msg || "Error en la petición");
  }

  return data;
};