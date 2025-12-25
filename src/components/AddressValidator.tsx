import '../App.css';
import { useState, useEffect} from "react";
import { fetchLocalities, Locality } from '../services/plzApi';

export function AddressValidator() {

    const [locality, setLocality] = useState<string>("");
    const [localitySuggestions, setLocalitySuggestions] = useState<Locality[]>([]);
    const [selectedLocality, setSelectedLocality] = useState<Locality | null>(null);

    const [isSelectionMade, setIsSelectionMade] = useState(false);
    const [postalCode, setPostalCode] = useState<string>("");
    const [postalCodeOptions, setPostalCodeOptions] = useState<string[]>([]);
    const [error, setError] = useState("");
  
    useEffect(() => {
        if (isSelectionMade) {
          // Don’t fetch suggestions after a selection until user types again
          return;
        }
        if (locality.trim().length < 2) {
          setLocalitySuggestions([]);
          setSelectedLocality(null);
          setPostalCodeOptions([]);
          setPostalCode("");
          setError("");
          return;
        }
      
        fetchLocalities(locality, "")
          .then((data) => {
            setLocalitySuggestions(data);
            setError("");
          })
          .catch(() => {
            setLocalitySuggestions([]);
            setError("Error fetching localities.");
          });
      }, [locality, isSelectionMade]);
      

    // 2. When user selects locality from dropdown
    const onSelectLocality = (locName: string) => {
        const loc = localitySuggestions.find(l => l.name === locName);
        if (!loc) return;

        setSelectedLocality(loc);
        setLocality(loc.name);
        setLocalitySuggestions([]); 
        setIsSelectionMade(true);   // mark selection made
        
        console.log("selected locality", locality);
        // Fetch postal codes for selected locality
        fetchLocalities(loc.name, "").then((data) => {
            console.log("fetching localities for selected locality now", data);
            if (data.length === 0) {
                setPostalCodeOptions([]);
                setPostalCode("");
                setError("No postal codes found for this locality.");
            } else if (data.length === 1) {
                setPostalCodeOptions([]);
                setPostalCode(data[0].postalCode);
                setError("");
            } else {
                setPostalCodeOptions(data.map(d => d.postalCode));
                setPostalCode("");
                setError("");
            }
            }).catch(() => {
            setPostalCodeOptions([]);
            setPostalCode("");
            setError("Error fetching postal codes.");
            });
    };

    const uniqueLocalities = localitySuggestions.reduce<Locality[]>((acc, loc) => {
        if (!acc.find(item => item.name === loc.name)) {
          acc.push(loc);
        }
        return acc;
      }, []);
      

    const handlePostalCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPostalCode(e.target.value);
    };

    return (
    <div>
        <h1>German Address Validator</h1>

        <div className='address-row'>
            <div className='field'>
                <label>
                City:
                <input
                    type="text"
                    value={locality}
                    onChange={e => {
                        setLocality(e.target.value);
                        setSelectedLocality(null);
                        setPostalCode("");
                        setPostalCodeOptions([]);
                        setError("");
                        setIsSelectionMade(false);
                      }}
                />
                </label>
                {uniqueLocalities.length > 0 && (
                    <ul
                        style={{
                        listStyle: "none",
                        border: "1px solid #ccc",
                        padding: 0,
                        marginTop: 0,
                        maxHeight: 150,
                        overflowY: "auto",
                        cursor: "pointer",
                        backgroundColor: "white",
                        }}
                    >
                        {uniqueLocalities.map(loc => (
                        <li
                            key={loc.name}
                            onClick={() => onSelectLocality(loc.name)}
                            style={{ padding: "8px 12px", borderBottom: "1px solid #eee", color: "black" }}
                        >
                            {loc.name}
                        </li>
                        ))}
                    </ul>
                    )}
            </div>

            <div className='field'>
                <label>Postal Code (PLZ):</label>
                {postalCodeOptions.length > 1 ? (
                    <select
                        value={postalCode}
                        onChange={handlePostalCodeChange}
                        required
                    >
                    <option value="">Select Postal Code</option>
                        {postalCodeOptions.map((code) => (
                            <option key={code} value={code}>
                            {code}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                      type="text"
                      value={postalCode}
                      style={{ color: "pink" }}
                      onChange={(e) => setPostalCode(e.target.value)}
                      readOnly={postalCodeOptions.length === 1} 
                      required
                    />
                  )}

               
            </div>
        </div>
    </div>
    );
}