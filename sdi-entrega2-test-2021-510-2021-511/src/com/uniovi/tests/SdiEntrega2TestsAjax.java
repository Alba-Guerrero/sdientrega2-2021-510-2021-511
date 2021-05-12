package com.uniovi.tests;
//Paquetes Java
import java.util.List;

//Paquetes JUnit 
import org.junit.*;
import org.junit.runners.MethodSorters;

import static org.junit.Assert.assertEquals;

//Paquetes Selenium 
import org.openqa.selenium.*;
import org.openqa.selenium.firefox.*;

//Paquetes con los Page Object
import com.uniovi.tests.pageobjects.*;
import com.uniovi.tests.util.DataBaseManager;


//Ordenamos las PRs por el nombre del método
@FixMethodOrder(MethodSorters.NAME_ASCENDING) 
public class SdiEntrega2TestsAjax {
	static String PathFirefox65 = "C:\\Program Files\\Mozilla Firefox\\firefox.exe";
	static String Geckdriver024 = "C:\\Users\\ignac\\Desktop\\Uni\\20-21\\SDI\\PL\\PL-SDI-Sesión5-material\\geckodriver024win64.exe";

	static WebDriver driver = getDriver(PathFirefox65, Geckdriver024); 
	static String URL = "http://localhost:8081/cliente.html";

	DataBaseManager dbManager = new DataBaseManager();

	public static WebDriver getDriver(String PathFirefox, String Geckdriver) {
		System.setProperty("webdriver.firefox.bin", PathFirefox);
		System.setProperty("webdriver.gecko.driver", Geckdriver);
		WebDriver driver = new FirefoxDriver();
		return driver;
	}


	@Before
	public void setUp() {
		dbManager.inicializarDB();
		driver.navigate().to(URL);
	}

	@After
	public void tearDown(){
		driver.manage().deleteAllCookies();
	}

	@BeforeClass 
	static public void begin() {
		//COnfiguramos las PRs.
		//Fijamos el timeout en cada opción de carga de una vista. 2 segundos.
		PO_View.setTimeout(3);
	}

	@AfterClass
	static public void end() {
		//Cerramos el navegador al finalizar las PRs
		driver.quit();
	}

	public void login(String demail, String dpass) {
		WebElement email = driver.findElement(By.name("email"));
		email.click();
		email.clear();
		email.sendKeys(demail);

		WebElement password = driver.findElement(By.name("password"));
		password.click();
		password.clear();
		password.sendKeys(dpass);
	}

	/**
	 * [Prueba30] Inicio de sesión con datos válidos.
	 */
	@Test
	public void PR30() {
		login("pedro@email.com" , "123456" );

		List<WebElement> elementos = PO_View.checkElement(driver, "free", "//button[contains(@id, 'boton-login')]");
		elementos.get(0).click();

		PO_View.checkElement(driver, "title", "Title");	
	}

	/**
	 * [Prueba31] Inicio de sesión con datos inválidos (email existente, pero contraseña incorrecta).
	 */
	@Test
	public void PR31() {
		login("pedro@email.com" , "1234567" );

		List<WebElement> elementos = PO_View.checkElement(driver, "free", "//button[contains(@id, 'boton-login')]");
		elementos.get(0).click();

		PO_View.checkElement(driver, "text", "Usuario no encontrado");	
	}

	/**
	 * [Prueba32] Inicio de sesión con datos válidos (campo email o contraseña vacíos).
	 */
	@Test
	public void PR32() {
		login("pedro@email.com" , "" );

		List<WebElement> elementos = PO_View.checkElement(driver, "free", "//button[contains(@id, 'boton-login')]");
		elementos.get(0).click();

		PO_View.checkElement(driver, "text", "Usuario no encontrado");	
	}

	/**
	 * Prueba33] Mostrar el listado de ofertas disponibles y comprobar que se muestran todas las que existen, menos las del usuario identificado.
	 */
	@Test
	public void PR33() {
		login("pedro@email.com" , "123456" );

		List<WebElement> elementos = PO_View.checkElement(driver, "free", "//button[contains(@id, 'boton-login')]");
		elementos.get(0).click();

		PO_View.checkElement(driver, "text", "Funda movil");
		PO_View.checkElement(driver, "text", "Cascos");
		PO_View.checkElement(driver, "text", "Pila");
		PO_View.checkElement(driver, "text", "Ordenador");
		PO_View.checkElement(driver, "text", "Tarjeta grafica");
		PO_View.checkElement(driver, "text", "Disco duro");
		PO_View.checkElement(driver, "text", "Vestido");
		PO_View.checkElement(driver, "text", "Sudadera");
		PO_View.checkElement(driver, "text", "Comida para perro");
		PO_View.checkElement(driver, "text", "Cable hdmi");
		PO_View.checkElement(driver, "text", "Reloj");
		PO_View.checkElement(driver, "text", "Chicles");
		PO_View.checkElement(driver, "text", "Camiseta");
	}

	/**
	 * [Prueba34] Sobre una búsqueda determinada de ofertas (a elección de desarrollador), enviar un mensaje a una oferta concreta. 
	 *  Se abriría dicha conversación por primera vez. Comprobar que el mensaje aparece en el listado de mensajes.
	 */
	@Test
	public void PR34() {
		login("pepa@email.com" , "123456" );

		List<WebElement> elementos = PO_View.checkElement(driver, "free", "//button[contains(@id, 'boton-login')]");
		elementos.get(0).click();
		
		elementos = PO_View.checkElement(driver, "free", "//a[contains(@id, 'enviarmsj')]");
		elementos.get(0).click();
		
		WebElement msj = driver.findElement(By.name("mensaje"));
		msj.click();
		msj.clear();
		msj.sendKeys("Holaaaa");
        By boton = By.className("btn");
        driver.findElement(boton).click();   
        
        PO_View.checkElement(driver, "text", "Holaaaa");
	}

	/**
	 * [Prueba35] Sobre el listado de conversaciones enviar un mensaje a una conversación ya abierta. 
	 *  Comprobar que el mensaje aparece en el listado de mensajes.
	 */
	@Test
	public void PR35() {
		PR34();
		
		List<WebElement> elementos = PO_View.checkElement(driver, "free", "//a[contains(@onclick, 'verConversaciones()')]");
		elementos.get(0).click();
		
		elementos = PO_View.checkElement(driver, "free", "//a[contains(@onclick, 'enviarMensajes')]");
		elementos.get(0).click();
		
		PO_View.checkElement(driver, "text", "Holaaaa");
	}

	/**
	 * [Prueba36] Mostrar el listado de conversaciones ya abiertas.
	 *  Comprobar que el listado contiene las conversaciones que deben ser.
	 */
	@Test
	public void PR36() {
		login("pedro@email.com" , "123456" );

		List<WebElement> elementos = PO_View.checkElement(driver, "free", "//button[contains(@id, 'boton-login')]");
		elementos.get(0).click();
		
		elementos = PO_View.checkElement(driver, "free", "//a[contains(@id, 'enviarmsj')]");
		elementos.get(0).click();
		
		WebElement msj = driver.findElement(By.name("mensaje"));
		msj.click();
		msj.clear();
		msj.sendKeys("Holaaaa");
        By boton = By.className("btn");
        driver.findElement(boton).click();   
        
        PO_View.checkElement(driver, "text", "Holaaaa");

        elementos = PO_View.checkElement(driver, "free", "//a[contains(@onclick, 'verConversaciones()')]");
		elementos.get(0).click();
    	
		elementos = PO_View.checkElement(driver, "free", "//tr");
		
        assertEquals(1, elementos.size());
	}

}

