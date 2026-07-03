export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  const contentType = response.headers.get("content-type");

  let data = null;

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();

    if (!response.ok) {
      throw new Error(
        `Error del servidor (${response.status}). Revisa que el backend esté encendido y que la ruta exista.`
      );
    }

    return text;
  }

  if (!response.ok) {
    if (response.status === 401 || data?.msg === "Token has expired") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("profile");

      window.location.href = "/login";
      return null;
    }

    throw new Error(data?.msg || "Error en la petición");
  }

  return data;
};