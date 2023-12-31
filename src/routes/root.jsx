import React from 'react'
import {
  Link,
  Outlet,
  useLoaderData,
  Form,
  redirect,
  NavLink,
  useNavigation,
  useSubmit,
} from "react-router-dom";
import { getContacts, createContact } from "../contacts";
import { useEffect } from "react";
import localforage from "localforage"; // Added
import Contact from "./contact";
import {set} from "../contacts"
import { useNavigate } from "react-router-dom";
// import { saveAs } from "../FileSaver"; // Added

export async function action() {
  const contact = await createContact();
  return redirect(`/contacts/${contact.id}/edit`);
}

export async function loader({ request }) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const contacts = await getContacts(q);
  return { contacts, q };
}

async function saveJSON() {
  // Pega o Objecto;
  let contacts = await localforage.getItem("contacts");
  // Transforma Objeto em String;
  const jsonFormatted = JSON.stringify(contacts);

  console.log(contacts);

  // Transforma String em Arquivo Blob;
  const blob = new Blob([jsonFormatted], { type: "application/json" });

  const date = getDateFormatted()

  saveAs(blob, 'contactsData(' + date + ').json')
}

async function loadJSON() {
  var receiveFile = document.getElementById('fileInput')
  var file = receiveFile.files[0]

  receiveFile.addEventListener("change", () => {
    file = receiveFile.files[0]
    doIt(file)
  })

  function doIt(file) {
    const reader = new FileReader();
    
    reader.onload = function(event) {
        const jsonText = event.target.result;
        const jsonObject = JSON.parse(jsonText);

        console.log(jsonObject);
        set(jsonObject)
        window.location.reload(true);
        useNavigate('/contacts');
    };
    
    reader.readAsText(file);
}
}

function getDateFormatted() {
  var date = new Date();
  var day = String(date.getDate()).padStart(2, '0');
  var month = String(date.getMonth() + 1).padStart(2, '0');
  var year = date.getFullYear();
  var dateFormatted = day + '.' + month + '.' + year;
  console.log(dateFormatted);
  
  return dateFormatted
}

export default function Root() {
  const { contacts, q } = useLoaderData();
  const navigation = useNavigation();
  const submit = useSubmit();
  const [showSidebar, setShowSidebar] = React.useState(false)

  const searching =
    navigation.location &&
    new URLSearchParams(navigation.location.search).has("q");

  useEffect(() => {
    document.getElementById("q").value = q;
  }, [q]);
  
  return (
    <>
      <button id="mobileToggle" className={showSidebar ? 'close' : ''}
        onClick={() => {setShowSidebar(!showSidebar)}}>
      </button>

      <div id='bgFilter' className={showSidebar ? 'active' : ''}
      onClick={() => {
        if (showSidebar) {
          setShowSidebar(!showSidebar)
        }
        }}>
      </div>

      <div id="sidebar" className={showSidebar ? 'show' : ''}>
        <h1>React Router Contacts</h1>
        
        <div>
          <Form id="search-form" role="search">
            <input
              id="q"
              className={searching ? "loading" : ""}
              aria-label="Search contacts"
              placeholder="Search"
              type="search"
              name="q"
              defaultValue={q}
              onChange={(event) => {
                const isFirstSearch = q == null;
                submit(event.currentTarget.form, {
                  replace: !isFirstSearch,
                });
              }}
            />
            <div id="search-spinner" aria-hidden hidden={!searching} />
            <div className="sr-only" aria-live="polite"></div>
          </Form>
          <Form method="post">
            <button type="submit">New</button>
          </Form>
        </div>
        <div id="dataHandler">
          <button onClick={saveJSON}> Save </button>
          <label id="customButton" htmlFor="fileInput">Load</label>
          <input type="file" onClick={loadJSON} name="Load" id="fileInput" accept="application/json"/>
        </div>
        <nav>
          {contacts.length ? (
            <ul>
              {contacts.map((contact) => (
                <li key={contact.id}>
                  <NavLink
                    to={`contacts/${contact.id}`}
                    className={({ isActive, isPending }) =>
                      isActive ? "active" : isPending ? "pending" : ""
                    }
                  >
                    {contact.first || contact.last ? (
                      <>
                        {contact.first} {contact.last}
                      </>
                    ) : (
                      <i>No Name</i>
                    )}{" "}
                    {contact.favorite && <span>★</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              <i>No contacts</i>
            </p>
          )}
        </nav>
       
      </div>
      
      <div
        id="detail"
        className={navigation.state === "loading" ? "loading" : ""}
      >
        <Outlet />
      </div>
    </>
  );
}