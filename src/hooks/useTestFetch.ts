    export const fetchData = async (onDetected) => {
      try {
        const response = await fetch('https://world.openfoodfacts.org/api/v0/product/3017620422003.json');
        const data = await response.json();
        if (data.status === 1) {
          // Found
          onDetected(data.product);
        }
      } catch (error) {
        console.error("Lookup error:", error);
      } finally {
        console.log("Fetching data");
      }
    };
