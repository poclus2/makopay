import axios from 'axios';

/**
 * NEXAH SMS API Test Script
 * Ce script teste l'envoi de SMS via NEXAH pour le Cameroun
 */

const NEXAH_CONFIG = {
    baseUrl: 'https://smsvas.com/bulk/public/index.php/api/v1',
    user: 'njoyaabdelazizthierry@gmail.com',
    password: 'Vykuj3546@',
    senderId: 'InfoSMS',
};

const TEST_NUMBERS = ['237655867729'];

interface NexahSendSmsResponse {
    responsecode: number;
    responsedescription: string;
    responsemessage: string;
    sms?: Array<{
        messageid: string;
        smsclientid: string;
        mobileno: string;
        status: string;
        errorcode: string;
        errordescription: string;
    }>;
}

interface NexahBalanceResponse {
    accountexpdate: string;
    balanceexpdate: string;
    credit: number;
}

/**
 * Test 1: Vérifier le solde du compte
 */
async function testGetBalance(): Promise<void> {
    console.log('\n📊 TEST 1: Récupération du solde NEXAH...');

    try {
        const response = await axios.post<NexahBalanceResponse>(
            `${NEXAH_CONFIG.baseUrl}/smscredit`,
            {
                user: NEXAH_CONFIG.user,
                password: NEXAH_CONFIG.password,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            }
        );

        console.log('✅ Solde récupéré avec succès:');
        console.log(`   💰 Crédits disponibles: ${response.data.credit} SMS`);
        console.log(`   📅 Expiration compte: ${response.data.accountexpdate}`);
        console.log(`   📅 Expiration balance: ${response.data.balanceexpdate}`);

        if (response.data.credit < 10) {
            console.warn('⚠️  Attention: Solde faible (< 10 SMS)');
        }
    } catch (error: any) {
        console.error('❌ Erreur lors de la récupération du solde:');
        console.error('   ', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Test 2: Envoyer un SMS de test
 */
async function testSendSms(): Promise<void> {
    console.log('\n📨 TEST 2: Envoi de SMS via NEXAH...');

    const testMessage = `Test MakoPay NEXAH SMS - ${new Date().toLocaleString('fr-FR')}`;
    const mobiles = TEST_NUMBERS.join(',');

    console.log(`📱 Numéros destinataires: ${mobiles}`);
    console.log(`💬 Message: "${testMessage}"`);

    try {
        const response = await axios.post<NexahSendSmsResponse>(
            `${NEXAH_CONFIG.baseUrl}/sendsms`,
            {
                user: NEXAH_CONFIG.user,
                password: NEXAH_CONFIG.password,
                senderid: NEXAH_CONFIG.senderId,
                sms: testMessage,
                mobiles: mobiles,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            }
        );

        console.log(`\n✅ Réponse de l'API:`);
        console.log(`   Code: ${response.data.responsecode}`);
        console.log(`   Description: ${response.data.responsedescription}`);
        console.log(`   Message: ${response.data.responsemessage}`);

        if (response.data.sms && response.data.sms.length > 0) {
            console.log(`\n📬 Détails des envois (${response.data.sms.length} SMS):`);
            response.data.sms.forEach((sms, index) => {
                console.log(`\n   SMS ${index + 1}:`);
                console.log(`      📞 Numéro: ${sms.mobileno}`);
                console.log(`      🆔 Message ID: ${sms.messageid}`);
                console.log(`      🔖 Client ID: ${sms.smsclientid}`);
                console.log(`      ✓ Status: ${sms.status}`);

                if (sms.errorcode) {
                    console.log(`      ❌ Error Code: ${sms.errorcode}`);
                    console.log(`      ❌ Error: ${sms.errordescription}`);
                }
            });

            const successCount = response.data.sms.filter(s => s.status === 'success').length;
            const failureCount = response.data.sms.length - successCount;

            console.log(`\n📊 Résumé: ${successCount} réussi(s), ${failureCount} échoué(s)`);
        }

    } catch (error: any) {
        console.error('❌ Erreur lors de l\'envoi du SMS:');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('   ', error.message);
        }
        throw error;
    }
}

/**
 * Test 3: Tester l'envoi GET (alternative)
 */
async function testSendSmsViaGet(): Promise<void> {
    console.log('\n🔄 TEST 3: Envoi de SMS via GET (méthode alternative)...');

    const testMessage = encodeURIComponent(`Test MakoPay GET - ${new Date().toLocaleString('fr-FR')}`);
    const mobiles = TEST_NUMBERS[0]; // Un seul numéro pour ce test

    const url = `${NEXAH_CONFIG.baseUrl}/sendsms?user=${encodeURIComponent(NEXAH_CONFIG.user)}&password=${encodeURIComponent(NEXAH_CONFIG.password)}&senderid=${NEXAH_CONFIG.senderId}&sms=${testMessage}&mobiles=${mobiles}`;

    try {
        const response = await axios.get<NexahSendSmsResponse>(url, {
            headers: {
                'Accept': 'application/json',
            }
        });

        console.log('✅ Réponse GET:');
        console.log(`   Code: ${response.data.responsecode}`);
        console.log(`   Status: ${response.data.responsedescription}`);

    } catch (error: any) {
        console.error('❌ Erreur lors de l\'envoi GET:');
        console.error('   ', error.response?.data || error.message);
    }
}

/**
 * Fonction principale
 */
async function main() {
    console.log('🚀 NEXAH SMS API - Script de Test\n');
    console.log('='.repeat(60));
    console.log(`📍 API: ${NEXAH_CONFIG.baseUrl}`);
    console.log(`👤 User: ${NEXAH_CONFIG.user}`);
    console.log(`📤 Sender ID: ${NEXAH_CONFIG.senderId}`);
    console.log('='.repeat(60));

    try {
        // Test 1: Balance
        await testGetBalance();

        // Pause de 2 secondes
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 2: Send SMS (POST)
        await testSendSms();

        // Pause de 2 secondes
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 3: Send SMS (GET) - Optionnel
        // await testSendSmsViaGet();

        console.log('\n' + '='.repeat(60));
        console.log('✅ Tous les tests sont terminés avec succès !');
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.log('\n' + '='.repeat(60));
        console.log('❌ Les tests ont échoué');
        console.log('='.repeat(60) + '\n');
        process.exit(1);
    }
}

// Exécution
main();
