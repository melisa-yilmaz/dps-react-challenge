
export interface Locality {
    name: string;
    postalCode: string;
  }

  export async function fetchLocalities(name: string, postalCode: string, isExactMatch: boolean): Promise<Locality[]> {
    try {
        console.log("In api call: ", name, postalCode, isExactMatch);
        if (!isExactMatch) {
            console.log("in regex ");
            name =  `^${name}`;
            postalCode = `^${postalCode}`;
        }

        const url = new URL("https://openplzapi.org/de/Localities");
        if (postalCode) url.searchParams.append("postalCode", postalCode);
        if (name) url.searchParams.append("name", name);

        console.log("Request URL:", url.toString()); 

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