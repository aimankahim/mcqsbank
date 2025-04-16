from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException, TimeoutException, NoSuchFrameException, ElementClickInterceptedException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import winsound
import requests

# Start de browser
driver = webdriver.Chrome()

# Open de website
driver.get("https://www.4daagse.nl")

# Accepteren cookies
time.sleep(2)
cookie_accept_button = driver.find_element(By.ID, "CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll")
cookie_accept_button.click()
print("✅ Cookie geaccepteerd")

# Open ticket sectie
Oranje_Knoppen = driver.find_elements(By.XPATH, "//button[contains(text(), 'Lees meer')]")
print(f"🔸 Aantal knoppen gevonden: {len(Oranje_Knoppen)}")

# Scroll naar de eerste knop en klik
driver.execute_script("arguments[0].scrollIntoView(true);", Oranje_Knoppen[0])
Oranje_Knoppen[0].click()
print("🎟️ Ticket sectie geopend")

# Wacht op de pagina en zoek naar iframes
time.sleep(2)
iframes = driver.find_elements(By.TAG_NAME, "iframe")
print(f"🖼️ Aantal iframes gevonden: {len(iframes)}")

# Functie om naar het juiste frame te switchen
def switch_to_target_frame():
    try:
        # Ga naar het tweede iframe en dan naar het geneste frame op niveau 1
        driver.switch_to.default_content()
        driver.switch_to.frame(1)
        print("✅ Geswitcht naar frame 2, niveau 1")
        return True
    except NoSuchFrameException:
        print("❌ Kan niet naar frame 2, niveau 1 switchen.")
        return False

# API check functie
def check_ticket_api():
    url = "https://atleta.cc/api/graphql"
    payload = {"query": "{ event(id: \"zRLhtOq7pOcB\") { registrations_for_sale_count } }"}
    headers = {"Content-Type": "application/json"}

    response = requests.post(url, json=payload, headers=headers)
    data = response.json()
    count = data['data']['event']['registrations_for_sale_count']
    return count > 0

# Zorg dat we in het juiste frame zitten
if switch_to_target_frame():
    print("🚀 Klaar om de knop te zoeken!")
    time.sleep(7)
    # Log teller
    poging = 0
    APIcall = 0

    # Blijf API checken tot er tickets zijn
    while not check_ticket_api():
        print(f" Poging {APIcall} om tickets te vinden via API...")
        APIcall += 1
        time.sleep(0.7)

    print("🎉 TICKETS BESCHIKBAAR! 🎉")
    winsound.Beep(1000, 1000)

    # Klik op de vernieuwen-knop in plaats van de hele pagina te refreshen
    try:
        vernieuwen_knop = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "span.sc-aXZVg.sc-kbousE.gYAfpi.gsChbC"))
        )
        time.sleep(0.3)
        vernieuwen_knop.click()
        print("🔄 Pagina vernieuwd via de knop!")
    except (NoSuchElementException, TimeoutException):
        print("❌ Vernieuwen-knop niet gevonden of niet klikbaar!")

    # Zoek de knop 'Claim' en klik erop
    try:
        claim_knop = WebDriverWait(driver, 5).until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Ticket kopen')]"))
        )
        claim_knop.click()
        print("➕ Ticket geclaimd!")
    except (NoSuchElementException, TimeoutException):
        print("❌ 'Claim' knop niet gevonden!")

    # Zoek naar een knop met koop/claim/verder/bestel/volgende (case-insensitive)
    try:
        vervolg_knop = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'koop') or contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'claim') or contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'verder') or contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'bestel') or contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'volgende')]"))
        )
        vervolg_knop.click()
        
        print("✅ Volgende stap gestart!")
        time.sleep(3000)
        

    except (NoSuchElementException, TimeoutException):
        print("❌ Volgende knop niet gevonden!")

    # Houd het scherm open voor handmatige betaling
    print("🚀 Scherm blijft open voor betaling. Sluit handmatig af als je klaar bent.")
    time.sleep(3000)

# Sluit de browser niet automatisch
print("✅ Script afgerond. Browser blijft open.")
time.sleep(3000)
