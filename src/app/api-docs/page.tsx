"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { useEffect, useState } from "react";

export default function SwaggerPage() {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    // Suprimir avisos de componentWillReceiveProps de bibliotecas externas
    const originalError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' && 
        args[0].includes('UNSAFE_componentWillReceiveProps')
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    fetch("/api/swagger")
      .then((res) => res.json())
      .then((data) => setSpec(data));

    return () => {
      console.error = originalError;
    };
  }, []);

  if (!spec) {
    return <div style={{ padding: "20px" }}>Carregando documentação...</div>;
  }

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <SwaggerUI 
        spec={spec}
        docExpansion="list"
        defaultModelsExpandDepth={1}
        displayRequestDuration={true}
      />
    </div>
  );
}
