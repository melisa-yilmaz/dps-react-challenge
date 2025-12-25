
export interface Locality {
    name: string;
    postalCode: string;
  }

  export async function fetchLocalities(name: string, postalCode: string): Promise<Locality[]> {
    try {
        const nameRegex = name ? `^${name}` : "";
        const postalCodeRegex = postalCode ? `^${postalCode}` : "";

        const url = new URL("https://openplzapi.org/de/Localities");
        if (postalCodeRegex) url.searchParams.append("postalCode", postalCodeRegex);
        if (nameRegex) url.searchParams.append("name", nameRegex);

        console.log("Request URL:", url.toString());  // Debug: print URL

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = (await response.json()) as Locality[];
        return data;

    } catch (error) {
        console.error("fetchLocalities error:", error);
        return [];
    }
  }