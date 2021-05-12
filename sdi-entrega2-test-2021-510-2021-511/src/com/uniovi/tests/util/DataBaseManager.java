package com.uniovi.tests.util;

import java.util.Date;

import org.bson.Document;

import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.model.Filters;

public class DataBaseManager {

	private String connectionString = "mongodb://admin:admin@mywallapop-shard-00-00.7adn3.mongodb.net:27017,mywallapop-shard-00-01.7adn3.mongodb.net:27017,mywallapop-shard-00-02.7adn3.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-3o8e26-shard-0&authSource=admin&retryWrites=true&w=majority";
	private String App = "myFirstDatabase";

	public DataBaseManager() {}

	public void inicializarDB() {
		vaciarDB();
		
		insertarUsuario("pedro@email.com", "6fabd6ea6f1518592b7348d84a51ce97b87e67902aa5a9f86beea34cd39a6b4a", "Pedro", "Fernandez", 100);
		insertarOferta("Peine de plata", "Un peine", "Un peine", "pedro@email.com", false, 50, "");
		insertarOferta("Falda", "Falda larga talla L", "Una falda","pedro@email.com", false, 5, "");
		insertarOferta("Cuchara", "Cuchara de acero inoxidable", "Una cuchara", "pedro@email.com", true, 10, "");
		insertarOferta("Monitor LED", "Monitor LED de 24 pulgadas", "Un monitor", "pedro@email.com", false, 500, "");
		insertarOferta("Microfono", "Microfono modelo AXD15", "Un microfono", "pedro@email.com", false, 30, "");
		
		insertarUsuario("ana@email.com", "6fabd6ea6f1518592b7348d84a51ce97b87e67902aa5a9f86beea34cd39a6b4a", "Ana", "Gonzalez", 100);
		insertarOferta("Funda movil", "Funda para movil modelo Redmi 4", "Funda movil", "ana@email.com", false, 6, "");
		insertarOferta("Cascos", "Cascos bluetooth", "Cascos", "ana@email.com", false, 25, "");
		insertarOferta("Pila", "Pila recargable", "Pilas", "ana@email.com", false, 4, "");

		insertarUsuario("pepa@email.com", "6fabd6ea6f1518592b7348d84a51ce97b87e67902aa5a9f86beea34cd39a6b4a", "Pepa", "Fernandez", 100);
		insertarOferta("Ordenador", "Ordenador gaming I7...", "Ordenador", "pepa@email.com", false, 1500, "");
		insertarOferta("Tarjeta grafica", "Tarjeta grafica gtx 1660", "Tarjeta grafica", "pepa@email.com", false, 120, "");
		insertarOferta("Disco duro", "Disco duro ssd 120gb", "Disco duro", "pepa@email.com", false, 100, "");
		insertarOferta("Vestido", "Vestido de una pieza", "Vestido", "pepa@email.com", false, 30, "");

		insertarUsuario("maria@email.com", "6fabd6ea6f1518592b7348d84a51ce97b87e67902aa5a9f86beea34cd39a6b4a", "Maria", "Martinez", 100);
		insertarOferta("Sudadera", "Sudadera MaxPower talla S hombre", "Sudadera", "maria@email.com", false, 20, "");
		insertarOferta("Comida para perro", "Comida para perros grande mas 10kg", "Comida de perro", "maria@email.com", true, 30, "pedro@email.com");
		insertarOferta("Cable hdmi", "Cable hdmi longitud 120 cm", "Cable hdmi", "maria@email.com", false, 10, "");

		insertarUsuario("miguel@email.com", "6fabd6ea6f1518592b7348d84a51ce97b87e67902aa5a9f86beea34cd39a6b4a", "Miguel", "Fernandez", 100);
		insertarOferta("Reloj", "Reloj rolex edicion limitada", "Reloj rolex", "miguel@email.com", false, 300, "");
		insertarOferta("Chicles", "Paquete x10 chicles", "Chicles", "miguel@email.com", true, 5, "pedro@email.com");
		insertarOferta("Camiseta", "Camiseta deporte M mujer", "Caimseta", "miguel@email.com", false, 10, "");
	}

	//Vacia la bd
	private void vaciarDB() {
		try (MongoClient mongoclient = MongoClients.create(connectionString)) {
			FindIterable<Document> usersIt = mongoclient.getDatabase(App).getCollection("usuarios").find();
			MongoCursor<Document> ite = usersIt.cursor();
			
			while (ite.hasNext()) {
				Document usuario = ite.next();

				mongoclient.getDatabase(App).getCollection("ofertas").deleteMany(Filters.eq("vendedor", usuario.get("email")));
				mongoclient.getDatabase(App).getCollection("conversaciones").deleteMany(Filters.eq("vendedor", usuario.get("email")));
				mongoclient.getDatabase(App).getCollection("usuarios").deleteMany(Filters.eq("role", "estandar"));
				mongoclient.getDatabase(App).getCollection("mensajes").deleteMany(Filters.eq("emisor", usuario.get("email")));
			}
		}
	}

	//Inserta usuarios
	private void insertarUsuario(String email, String password, String nombre, String apellido, int dinero) {
		try (MongoClient mongoclient = MongoClients.create(connectionString)) {
			Document usuario = new Document()
					.append("email", email)
					.append("name", nombre)
					.append("lastname", apellido)
					.append("password", password)
					.append("saldo", dinero)
					.append("role", "estandar");
			
			mongoclient.getDatabase(App).getCollection("usuarios").insertOne(usuario);
		}
	}
	
	//Inserta ofertas
	@SuppressWarnings("deprecation")
	public void insertarOferta(String titulo,String detalle, String descripcion, String vendedor, boolean comprado, int precio, String comprador) {
		try (MongoClient mongoclient = MongoClients.create(connectionString)) {
			Document oferta = new Document()
					.append("title", titulo)
					.append("detalle", detalle)
					.append("descripcion", descripcion)
					.append("fecha", new Date().toGMTString())
					.append("precio", precio)
					.append("vendedor", vendedor)
					.append("comprada", comprado)
					.append("comprador", comprador);
			
			mongoclient.getDatabase(App).getCollection("ofertas").insertOne(oferta);
		}
	}
	
	//Inserta conversaciones
	public void insertarConversacion(String interesado, String vendedor, String idOferta, String title) {
		try (MongoClient mongoclient = MongoClients.create(connectionString)) {
			Document conversacion = new Document()
					.append("interesado", interesado)
					.append("vendedor", vendedor)
					.append("oferta", idOferta)
					.append("title", title);
			
			mongoclient.getDatabase(App).getCollection("conversaciones").insertOne(conversacion);
		}
	}
}