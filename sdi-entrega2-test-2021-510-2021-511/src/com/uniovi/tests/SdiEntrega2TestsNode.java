package com.uniovi.tests;
//Paquetes Java
import java.util.List;

//Paquetes JUnit 
import org.junit.*;
import org.junit.runners.MethodSorters;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
//Paquetes Selenium 
import org.openqa.selenium.*;
import org.openqa.selenium.firefox.*;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

//Paquetes con los Page Object
import com.uniovi.tests.pageobjects.*;
import com.uniovi.tests.util.DataBaseManager;


//Ordenamos las PRs por el nombre del método
@FixMethodOrder(MethodSorters.NAME_ASCENDING) 
public class SdiEntrega2TestsNode {
	static String PathFirefox65 = "C:\\Program Files\\Mozilla Firefox\\firefox.exe";
	static String Geckdriver024 = "C:\\Users\\ignac\\Desktop\\Uni\\20-21\\SDI\\PL\\PL-SDI-Sesión5-material\\geckodriver024win64.exe";

	static WebDriver driver = getDriver(PathFirefox65, Geckdriver024); 

	static String URL = "http://localhost:8081";

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

	public void login(String email, String pass) {
		PO_HomeView.clickOption(driver, "identificarse", "class", "btn btn-primary");
		PO_LoginView.fillForm(driver, email , pass );
		PO_View.checkElement(driver, "text", "Crear Oferta");
	}

	public void fillFormOferta(String title, String descripcion, String detalle, int precio) {
		WebElement titulo = driver.findElement(By.name("title"));
		titulo.click();
		titulo.clear();
		titulo.sendKeys(title);
		WebElement dni = driver.findElement(By.name("descripcion"));
		dni.click();
		dni.clear();
		dni.sendKeys(descripcion);
		WebElement name = driver.findElement(By.name("detalle"));
		name.click();
		name.clear();
		name.sendKeys(detalle);
		WebElement lastname = driver.findElement(By.name("precio"));
		lastname.click();
		lastname.clear();
		lastname.sendKeys(String.valueOf(precio));

		By boton = By.className("btn");
		driver.findElement(boton).click();
	}

	/**
	 * [PR1] Registro de Usuario con datos válidos.
	 */
	@Test
	public void PR01() {
		PO_HomeView.clickOption(driver, "registrarse", "class", "btn btn-primary");
		PO_RegisterView.fillForm(driver, "jose@email.com", "Jose", "González", "123456", "123456");
		PO_View.checkElement(driver, "text", "Crear Oferta");
	}

	/**
	 * PR2] Registro de Usuario con datos inválidos (email vacío, nombre vacío, apellidos vacíos).
	 */
	@Test
	public void PR02() {
		PO_HomeView.clickOption(driver, "registrarse", "class", "btn btn-primary");
		PO_RegisterView.fillForm(driver, "", "", "", "123456", "123456");
		PO_View.checkElement(driver, "h2", "Registrar usuario");
	}

	/**
	 * [PR3] Registro de Usuario con datos inválidos (repetición de contraseña inválida).
	 */
	@Test
	public void PR03() {
		PO_HomeView.clickOption(driver, "registrarse", "class", "btn btn-primary");
		PO_RegisterView.fillForm(driver, "antonio@email.com", "Antonio", "Suarez", "1234567", "123456");
		PO_View.checkElement(driver, "text", "Las contraseñas no coinciden");
	}

	/**
	 * [PR4] Registro de Usuario con datos inválidos (email existente).
	 */
	@Test
	public void PR04() {
		PO_HomeView.clickOption(driver, "registrarse", "class", "btn btn-primary");
		PO_RegisterView.fillForm(driver, "ana@email.com", "Ana", "Perez", "123456", "123456");
		PO_View.checkElement(driver, "text", "Este usuario ya existe en el sistema");
	}

	/**
	 * [PR5] Inicio de sesión con datos válidos.
	 */
	@Test
	public void PR05() {
		login("pedro@email.com", "123456");
	}

	/**
	 * [PR6] Inicio de sesión con datos inválidos (email existente, pero contraseña incorrecta).
	 */
	@Test
	public void PR06() {
		PO_HomeView.clickOption(driver, "identificarse", "class", "btn btn-primary");
		PO_LoginView.fillForm(driver, "pedro@email.com" , "123456789" );
		PO_View.checkElement(driver, "text", "Email o password incorrecto");
	}

	/**
	 * [PR7] Inicio de sesión con datos inválidos (campo email o contraseña vacíos).
	 */
	@Test
	public void PR07() {
		PO_HomeView.clickOption(driver, "identificarse", "class", "btn btn-primary");
		PO_LoginView.fillForm(driver, "" , "123456" );
		PO_View.checkElement(driver, "h2", "Identificación de usuario");
	}

	/**
	 * [PR8] Inicio de sesión con datos inválidos (email no existente en la aplicación).
	 */
	@Test
	public void PR08() {
		PO_HomeView.clickOption(driver, "identificarse", "class", "btn btn-primary");
		PO_LoginView.fillForm(driver, "sergio@email.com" , "123456" );
		PO_View.checkElement(driver, "text", "Email o password incorrecto");
	}

	/**
	 * [PR9] Hacer click en la opción de salir de sesión y comprobar que se redirige a la página de 
	 * inicio de sesión (Login).
	 */
	@Test
	public void PR09() {
		login("pedro@email.com", "123456");

		PO_HomeView.clickOption(driver, "desconectarse", "class", "btn btn-primary");
		PO_View.checkElement(driver, "text", "Ha cerrado sesión con éxito");
	}

	/**
	 * [PR10] Comprobar que el botón cerrar sesión no está visible si el usuario no está autenticado
	 */
	@Test
	public void PR10() {
		assertTrue((new WebDriverWait(driver, 2)).until(ExpectedConditions.invisibilityOfElementLocated(By.xpath("//*[contains(text(),'Desconectarse')]"))));
	}

	/**
	 * [PR11] Mostrar el listado de usuarios y comprobar que se muestran todos los que existen en el sistema.
	 */
	@Test
	public void PR11() {
		PO_HomeView.clickOption(driver, "identificarse", "class", "btn btn-primary");
		PO_LoginView.fillForm(driver, "admin@email.com" , "admin" );

		PO_View.checkElement(driver, "free", "//input[contains(@value, 'pedro@email.com')]");
		PO_View.checkElement(driver, "free", "//input[contains(@value, 'pepa@email.com')]");
		PO_View.checkElement(driver, "free", "//input[contains(@value, 'maria@email.com')]");
		PO_View.checkElement(driver, "free", "//input[contains(@value, 'ana@email.com')]");
	}

	/**
	 * [PR12] Ir a la lista de usuarios, borrar el primer usuario de la lista, comprobar que la lista se actualiza y dicho usuario desaparece.
	 */
	@Test
	public void PR12() {
		PO_HomeView.clickOption(driver, "identificarse", "class", "btn btn-primary");
		PO_LoginView.fillForm(driver, "admin@email.com" , "admin" );

		List<WebElement> elementos = PO_View.checkElement(driver, "free", "//input[contains(@type, 'checkbox')]");
		int numUsuariosIniciales = elementos.size();
		elementos.get(0).click();

		elementos = PO_View.checkElement(driver, "free", "//button[contains(@id, 'boton')]");
		elementos.get(0).click();

		elementos = PO_View.checkElement(driver, "free", "//input[contains(@type, 'checkbox')]");
		int numUsuariosFinales = elementos.size();

		assertEquals(numUsuariosIniciales - 1,  numUsuariosFinales);
	}

	/**
	 * [PR13] Ir a la lista de usuarios, borrar el último usuario de la lista, comprobar que la lista se actualiza y dicho usuario desaparece.
	 */
	@Test
	public void PR13() {
		PO_HomeView.clickOption(driver, "identificarse", "class", "btn btn-primary");
		PO_LoginView.fillForm(driver, "admin@email.com" , "admin" );

		List<WebElement> elementos = PO_View.checkElement(driver, "free", "//input[contains(@type, 'checkbox')]");
		int numUsuariosIniciales = elementos.size();
		elementos.get(elementos.size() - 1).click();

		elementos = PO_View.checkElement(driver, "free", "//button[contains(@id, 'boton')]");
		elementos.get(0).click();

		elementos = PO_View.checkElement(driver, "free", "//input[contains(@type, 'checkbox')]");
		int numUsuariosFinales = elementos.size();

		assertEquals(numUsuariosIniciales - 1,  numUsuariosFinales);
	}

	/**
	 * [PR14] Ir a la lista de usuarios, borrar 3 usuarios, comprobar que la lista se actualiza y dichos usuarios desaparecen.
	 */
	@Test
	public void PR14() {
		PO_HomeView.clickOption(driver, "identificarse", "class", "btn btn-primary");
		PO_LoginView.fillForm(driver, "admin@email.com" , "admin" );

		List<WebElement> elementos = PO_View.checkElement(driver, "free", "//input[contains(@type, 'checkbox')]");
		int numUsuariosIniciales = elementos.size();
		elementos.get(0).click();
		elementos.get(1).click();
		elementos.get(2).click();

		elementos = PO_View.checkElement(driver, "free", "//button[contains(@id, 'boton')]");
		elementos.get(0).click();

		elementos = PO_View.checkElement(driver, "free", "//input[contains(@type, 'checkbox')]");
		int numUsuariosFinales = elementos.size();

		assertEquals(numUsuariosIniciales - 3,  numUsuariosFinales);
	}

	/**
	 * [PR15] Ir al formulario de alta de oferta, rellenarla con datos válidos y pulsar el botón Submit.
	 *  Comprobar que la oferta sale en el listado de ofertas de dicho usuario.
	 */
	@Test
	public void PR15() {
		login("pedro@email.com", "123456");

		List<WebElement> elementos = PO_View.checkElement(driver, "free", "//a[contains(@href, '/oferta/add')]");
		elementos.get(0).click();

		fillFormOferta("Oredenador de sobremesa", "Un ordenador de sobremesa nuevo", "Procesador i3, gtx 970, 16 GB RAM", 450);

		elementos = PO_View.checkElement(driver, "free", "//a[contains(@href, '/misoferta/list')]");
		elementos.get(0).click();

		PO_View.checkElement(driver, "text", "Procesador i3, gtx 970, 16 GB RAM");
	}

	/**
	 * [PR16] Ir al formulario de alta de oferta, rellenarla con datos inválidos (campo título vacío y precio en negativo) y pulsar el botón Submit. 
	 *  Comprobar que se muestra el mensaje de campo obligatorio.
	 */
	@Test
	public void PR16() {
		login("pedro@email.com", "123456");

		List<WebElement> elementos = PO_View.checkElement(driver, "free", "//a[contains(@href, '/oferta/add')]");
		elementos.get(0).click();

		fillFormOferta("", "Un ordenador de sobremesa nuevo", "Procesador i3, gtx 970, 16 GB RAM", 450);

		PO_View.checkElement(driver, "h2", "Agregar oferta");
	}

	/**
	 * [PR17] Mostrar el listado de ofertas para dicho usuario y comprobar que se muestran todas las que existen para este usuario.  
	 */
	@Test
	public void PR17() {
		login("ana@email.com", "123456");

		List<WebElement> elementos = PO_View.checkElement(driver, "free", "//a[contains(@href, '/misoferta/list')]");
		elementos.get(0).click();

		PO_View.checkElement(driver, "text", "Funda movil");
		PO_View.checkElement(driver, "text", "Cascos bluetooth");
		PO_View.checkElement(driver, "text", "Pila recargable");
	}

	/**
	 * [PR18] Ir a la lista de ofertas, borrar la primera oferta de la lista, comprobar que la lista se actualiza y que la oferta desaparece.
	 */
	@Test
	public void PR18() {
		login("pedro@email.com", "123456");

		List<WebElement> elementos = PO_View.checkElement(driver, "free", "//a[contains(@href, '/misoferta/list')]");
		elementos.get(0).click();

		elementos = PO_View.checkElement(driver, "free", "//a[contains(@id, 'delete')]");
		int inicio = elementos.size();
		elementos.get(0).click();

		//Al eliminar la oferta esta tarda un rato en eliminarse pero el test finaliza por lo que recargamos la lista para ver las ofertas propias
		elementos = PO_View.checkElement(driver, "free", "//a[contains(@href, '/misoferta/list')]");
		elementos.get(0).click();

		elementos = PO_View.checkElement(driver, "free", "//a[contains(@id, 'delete')]");
		assertEquals(inicio - 1, elementos.size());
	}

	/**
	 * [PR19] Ir a la lista de ofertas, borrar la última oferta de la lista, comprobar que la lista se actualiza y que la oferta desaparece.
	 */
	@Test
	public void PR19() {
		login("pedro@email.com", "123456");

		List<WebElement> elementos = PO_View.checkElement(driver, "free", "//a[contains(@href, '/misoferta/list')]");
		elementos.get(0).click();

		elementos = PO_View.checkElement(driver, "free", "//a[contains(@id, 'delete')]");
		int inicio = elementos.size();
		elementos.get(elementos.size() - 1).click();

		//Al eliminar la oferta esta tarda un rato en eliminarse pero el test finaliza por lo que recargamos la lista para ver las ofertas propias
		elementos = PO_View.checkElement(driver, "free", "//a[contains(@href, '/misoferta/list')]");
		elementos.get(0).click();

		elementos = PO_View.checkElement(driver, "free", "//a[contains(@id, 'delete')]");
		assertEquals(inicio - 1, elementos.size());
	}

	/**
	 * PR20] Hacer una búsqueda con el campo vacío y comprobar que se muestra la página que 
	 *  corresponde con el listado de las ofertas existentes en el sistema
	 */
	@Test
	public void PR20() {
		login("pedro@email.com", "123456");

		List<WebElement> elementos = PO_View.checkElement(driver, "free", "//button[contains(@type, 'submit')]");
		elementos.get(0).click();

		PO_View.checkElement(driver, "text", "Peine de plata");

		elementos = PO_View.checkElement(driver, "free", "//a[contains(@class, 'page-link')]");
		assertEquals("1", elementos.get(0).getText());
	}

	/**
	 * PR21] Hacer una búsqueda escribiendo en el campo un texto que no exista y comprobar que se 
	 *  muestra la página que corresponde, con la lista de ofertas vacía.
	 */
	@Test
	public void PR21() {
		login("pedro@email.com", "123456");

		WebElement text = driver.findElement(By.name("busqueda"));
		text.click();
		text.clear();
		text.sendKeys("wewewewewewe");

		List<WebElement> elementos = PO_View.checkElement(driver, "free", "//button[contains(@type, 'submit')]");
		elementos.get(0).click();

		assertTrue((new WebDriverWait(driver, 2)).until(ExpectedConditions.invisibilityOfElementLocated(By.xpath("//td[contains(text(),'Peine de plata')]"))));

		elementos = PO_View.checkElement(driver, "free", "//a[contains(@class, 'page-link')]");
		assertEquals("1", elementos.get(0).getText());
	}

	/**
	 * [PR22] Hacer una búsqueda escribiendo en el campo un texto en minúscula o mayúscula y comprobar que se muestra la página que corresponde, 
	 *  con la lista de ofertas que contengan dicho texto, independientemente que el título esté almacenado en minúsculas o mayúscula.
	 */
	@Test
	public void PR22() {
		login("pedro@email.com", "123456");

		WebElement text = driver.findElement(By.name("busqueda"));
		text.click();
		text.clear();
		text.sendKeys("Peine");

		List<WebElement> elementos = PO_View.checkElement(driver, "free", "//button[contains(@type, 'submit')]");
		elementos.get(0).click();

		PO_View.checkElement(driver, "text", "Peine de plata");

		elementos = PO_View.checkElement(driver, "free", "//a[contains(@class, 'page-link')]");
		assertEquals("1", elementos.get(0).getText());
	}

	/**
	 * [PR23] Sobre una búsqueda determinada (a elección de desarrollador), comprar una oferta que deja un saldo positivo en el
	 *  contador del comprobador. Y comprobar que el contador se actualiza correctamente en la vista del comprador.
	 */
	@Test
	public void PR23() {
		login("pedro@email.com", "123456");

		WebElement text = driver.findElement(By.name("busqueda"));
		text.click();
		text.clear();
		text.sendKeys("Vestido");

		List<WebElement> elementos = PO_View.checkElement(driver, "free", "//button[contains(@type, 'submit')]");
		elementos.get(0).click();

		elementos = PO_View.checkElement(driver, "free", "//a[contains(@href, '/oferta/comprar/')]");
		elementos.get(0).click();

		elementos = PO_View.checkElement(driver, "free", "//a[contains(@id, 'saldo')]");
		assertEquals("Saldo: 70", elementos.get(0).getText());
	}

	/**
	 * [PR24] Sobre una búsqueda determinada (a elección de desarrollador), comprar una oferta que deja un saldo 0
	 *  en el contador del comprobador. Y comprobar que el contador se actualiza correctamente en la vista del comprador. 
	 */
	@Test
	public void PR24() {
		login("pedro@email.com", "123456");

		WebElement text = driver.findElement(By.name("busqueda"));
		text.click();
		text.clear();
		text.sendKeys("Disco duro");

		List<WebElement> elementos = PO_View.checkElement(driver, "free", "//button[contains(@type, 'submit')]");
		elementos.get(0).click();

		elementos = PO_View.checkElement(driver, "free", "//a[contains(@href, '/oferta/comprar/')]");
		elementos.get(0).click();

		elementos = PO_View.checkElement(driver, "free", "//a[contains(@id, 'saldo')]");
		assertEquals("Saldo: 0", elementos.get(0).getText());
	}

	/**
	 * PR25] Sobre una búsqueda determinada (a elección de desarrollador), intentar comprar una oferta que esté por 
	 *  encima de saldo disponible del comprador. Y comprobar que se muestra el mensaje de saldo no suficiente.
	 */
	@Test
	public void PR25() {
		login("pedro@email.com", "123456");

		WebElement text = driver.findElement(By.name("busqueda"));
		text.click();
		text.clear();
		text.sendKeys("Tarjeta");

		List<WebElement> elementos = PO_View.checkElement(driver, "free", "//button[contains(@type, 'submit')]");
		elementos.get(0).click();

		elementos = PO_View.checkElement(driver, "free", "//a[contains(@href, '/oferta/comprar/')]");
		elementos.get(0).click();

		PO_View.checkElement(driver, "text", "No tienes suficientes dinero");
	}


	/**
	 * [Prueba26] Ir a la opción de ofertas compradas del usuario y mostrar la lista. Comprobar que aparecen las ofertas que deben aparecer.
	 */
	@Test
	public void PR26() {
		login("pedro@email.com", "123456");

		List<WebElement> elementos = PO_View.checkElement(driver, "free", "//a[contains(@href, '/oferta/compradas')]");
		elementos.get(0).click();

		PO_View.checkElement(driver, "text", "Chicles");
		PO_View.checkElement(driver, "text", "Comida para perro");
	}
}

