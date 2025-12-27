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
  
    const [debouncedLocality, setDebouncedLocality] = useState(locality);
    const [debouncedPostalCode, setDebouncedPostalCode] = useState(postalCode);

    type InputMode = "idle" | "locality" | "postalCode";
    const [mode, setMode] = useState<InputMode>("idle");


    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedPostalCode(postalCode);
        }, 1000);
    
        return () => clearTimeout(handler);
    }, [postalCode]);

        
    useEffect(() => {
        if (mode !== "postalCode") return;
        console.log("Mode is: ", mode);
        setIsSelectionMade(false);

        if (debouncedPostalCode.trim().length < 5) {
            setLocality("");
            setLocalitySuggestions([]);
            return;
        } 
    
      
        fetchLocalities("", debouncedPostalCode).then((data) => {
          if (data.length === 0) {
            setLocality("");
            setLocalitySuggestions([]);
            setError("Invalid postal code.");
          } else if (data.length === 1) {
            setLocality(data[0].name);
            setLocalitySuggestions([]);
            setError("");
          } else {
            setLocality("");
            setLocalitySuggestions(data);
            setError("");
          }
        }).catch(() => {
          setLocality("");
          setLocalitySuggestions([]);
          setError("Error fetching localities.");
        });
      }, [debouncedPostalCode, mode]);


    // debounce for locality
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedLocality(locality);
        }, 500);
    
        return () => clearTimeout(handler);
    }, [locality]);

    useEffect(() => {
        if (mode !== "locality") return;
        console.log("Mode is: ", mode);
        if (isSelectionMade) return;
      
        if (debouncedLocality.trim().length < 3) {
          setLocalitySuggestions([]);
          setSelectedLocality(null);
          setPostalCodeOptions([]);
          setPostalCode("");
          setError("");
          return;
        }
      
        fetchLocalities(debouncedLocality, "")
          .then(data => {
            setLocalitySuggestions(data);
            if(data.length === 0) {
                setError("No such a city");
                setPostalCodeOptions([]); 
                setPostalCode("");
            } else {
                setError("");
            }
         
          })
          .catch(() => {
            setLocalitySuggestions([]);
            setError("Error fetching localities.");
          });
    }, [debouncedLocality, isSelectionMade, mode]);
      

    // When user selects locality from dropdown
    const onSelectLocality = (locName: string) => {
        setMode("locality"); 
        const loc = localitySuggestions.find(l => l.name === locName);
        if (!loc) return;

        setSelectedLocality(loc);
        setLocality(loc.name);
        setLocalitySuggestions([]); 
        setIsSelectionMade(true);   

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
                console.log("There is only one postal code for the selected locality")
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
        <h2 className='title'>German Address Validator</h2>

        <div className='address-row'>
            <div className='field'>
                <label className="floating-label">
                <input
                    type="text"
                    value={locality}
                    onChange={e => {
                        setMode("locality");
                        setLocality(e.target.value);
                        //setSelectedLocality(null);
                        //setPostalCode("");
                        //setPostalCodeOptions([]);
                        setIsSelectionMade(false);
                        //setLocalitySuggestions([]); 
                      }}
                      placeholder=' '     
                />
                <span>City</span>
                </label>
                {uniqueLocalities.length > 0 && (
                    <ul className='dropdown' >
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
                <label className="floating-label">
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
                        inputMode="numeric"
                        maxLength={5}
                        value={postalCode}
                        onChange={(e) =>  {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 5);
                        setMode("postalCode");
                        setPostalCode(value);
                        setLocalitySuggestions([]);
                        setPostalCodeOptions([]);
                        setError("");
                        setIsSelectionMade(false)}}
                        required
                        placeholder=' '
                    />
                    )}
                    <span>Postal Code</span>
                </label>
            </div>
        </div>
        {error && (
        <p style={{ color: "red", marginTop: "8px" }}>
            {error}
        </p>
        )}
    </div>
    );
}