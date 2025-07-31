# -_-_-_-_-_-_-_-_-_-_-_ Client Socket -_-_-_-_-_-_-_-_-_-_-_

import socket
import sys

# Création de la fonction main du client
def main():

    # Configuration du serveur
    HOST = "localhost"
    PORT = 9999

    # Création d'une connexion avec le serveur
    client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        
        # Connexion du client au serveur
        client.connect((HOST, PORT))
        print(f"Connexion établie avec le serveur :\t{HOST}:{PORT}\n")
        print("Écrivez vos messages (ou 'quit' pour quitter) :\n")

        # Boucle principale pour envoyer/recevoir les messages
        while True:
            # Récupération du message saisi par le client
            message = input("> ")

            # Vérifier si le client souhaite quitter
            if message.lower() == 'quit':
                print("\n\t\tVous avez quitté l'application. À très bientôt.\n")
                break

            # Envoi du message au serveur
            client.send(message.encode('utf-8'))

            # Réception de la réponse du serveur
            reponse_serveur = client.recv(1024)
            message_server = reponse_serveur.decode('utf-8')

            print(f"\nMessage ECHO : {message_server}")

    # Gestion des exceptions
    except ConnectionRefusedError:
        print("Impossible de se connecter au serveur.\n")

    except KeyboardInterrupt:
        print("\nDéconnexion forcée...")

    finally:
        client.close()  
        print("\n\t\tClient fermé.\n")

# Lancement du programme
if __name__ == "__main__":
    main()
