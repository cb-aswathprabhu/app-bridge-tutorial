/*

  App Page

  App container component.

*/
import React, { useState, useEffect } from "react";

const getProducts = () => {
  return fetch('/products').then((response) => response.json());
}

export default function AppPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    getProducts()
      .then((data) => setProducts(data.products));
  }, [])

  function handleNewTab() {
    window.open('https://dbf8-110-172-187-6.ngrok.io?shop=debris-magics.myshopify.com', '_blank').focus();
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between'}}>
      {products.length !== 0 ? (
        <>
          <ul>
            {products.map((product) => {
              let { title, updated_at, vendor, status, id } = product;
              return (
                <li key={id.toString()}>
                  <div>Title: {title}</div>
                  <div>Updated At: {updated_at}</div>
                  <div>Vendor: {vendor}</div>
                  <div>Status: {status}</div>
                </li>
              )
            })}
          </ul>
          <div>
            <button onClick={handleNewTab}>Open In New Tab</button>
          </div>
        </>
      ) : (
        <div>Loading Products...</div>
      )}
    </div>
  )
}
